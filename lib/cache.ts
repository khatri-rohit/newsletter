// ==========================================
// CACHING UTILITY WITH REDIS
// ==========================================

import { getRedisClient } from './redis';

/**
 * Promise wrapper with timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);
}

class CacheManager {
  private redisAvailable: boolean | null = null; // null = not checked yet
  private redisCheckInProgress: boolean = false;
  private redisCheckedAt: number = 0;
  private readonly redisRetryIntervalMs = 30_000;

  /**
   * Check if Redis is available (with caching to avoid repeated checks)
   */
  private async checkRedisAvailable(): Promise<boolean> {
    // Return cached result if it's still within the retry window
    if (this.redisAvailable !== null) {
      const elapsed = Date.now() - this.redisCheckedAt;
      if (this.redisAvailable === true || elapsed < this.redisRetryIntervalMs) {
        return this.redisAvailable;
      }
    }

    // Prevent multiple simultaneous checks
    if (this.redisCheckInProgress) {
      return false; // Use memory cache while checking
    }

    this.redisCheckInProgress = true;

    try {
      const client = await withTimeout(getRedisClient(), 3000); // 3 second timeout
      await withTimeout(client.ping(), 2000); // 2 second timeout for ping
      this.redisAvailable = true;
      this.redisCheckedAt = Date.now();
      console.log('[Cache] Redis is available, using Redis for caching');
      return true;
    } catch (error) {
      console.log(
        '[Cache] Redis not available, caching disabled:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      this.redisAvailable = false;
      this.redisCheckedAt = Date.now();
      return false;
    } finally {
      this.redisCheckInProgress = false;
    }
  }

  /**
   * Set a cache entry with TTL (in milliseconds)
   */
  async set<T>(key: string, data: T, ttl: number = 60000): Promise<void> {
    try {
      const useRedis = await this.checkRedisAvailable();

      if (!useRedis) {
        return;
      }

      const client = await getRedisClient();
      const ttlSeconds = Math.ceil(ttl / 1000);
      await withTimeout(client.setEx(key, ttlSeconds, JSON.stringify(data)), 3000);
    } catch (error) {
      console.error('[Cache] Error setting cache:', error);
    }
  }

  /**
   * Get a cache entry
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const useRedis = await this.checkRedisAvailable();

      if (!useRedis) {
        return null;
      }

      const client = await getRedisClient();
      const value = await withTimeout(client.get(key), 3000);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error('[Cache] Error getting cache:', error);
      return null;
    }
  }

  /**
   * Check if cache entry exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const useRedis = await this.checkRedisAvailable();

      if (!useRedis) {
        return false;
      }

      const client = await getRedisClient();
      const exists = await withTimeout(client.exists(key), 3000);
      return exists === 1;
    } catch (error) {
      console.error('[Cache] Error checking cache:', error);
      return false;
    }
  }

  /**
   * Delete a cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      const useRedis = await this.checkRedisAvailable();

      if (!useRedis) {
        return;
      }

      const client = await getRedisClient();
      await withTimeout(client.del(key), 3000);
    } catch (error) {
      console.error('[Cache] Error deleting cache:', error);
    }
  }

  /**
   * Delete multiple cache entries by pattern
   * Useful for invalidating related cache entries
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const useRedis = await this.checkRedisAvailable();

      if (!useRedis) {
        return;
      }

      const client = await getRedisClient();
      const keys = await withTimeout(client.keys(pattern), 3000);
      if (keys.length > 0) {
        await withTimeout(client.del(keys), 3000);
        console.log(`[Cache] Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error('[Cache] Error deleting pattern:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const useRedis = await this.checkRedisAvailable();

      if (!useRedis) {
        return;
      }

      const client = await getRedisClient();
      // Only delete keys with our namespace prefix to avoid affecting other apps
      const keys = await withTimeout(client.keys('newsletter:*'), 3000);
      if (keys.length > 0) {
        await withTimeout(client.del(keys), 3000);
        console.log(`[Cache] Cleared ${keys.length} newsletter cache entries`);
      }
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; type: 'redis' }> {
    try {
      const useRedis = await this.checkRedisAvailable();

      if (useRedis) {
        const client = await getRedisClient();
        const keys = await withTimeout(client.keys('newsletter:*'), 3000);
        return { keys: keys.length, type: 'redis' };
      }

      return { keys: 0, type: 'redis' };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return { keys: 0, type: 'redis' };
    }
  }
}

// Create cache instance
export const cache = new CacheManager();

// Cache key generators
export const cacheKeys = {
  newsletter: (id: string) => `newsletter:${id}`,
  newsletterBySlug: (slug: string) => `newsletter:slug:${slug}`,
  newslettersAll: () => 'newsletters:all',
  newslettersTop: (limit: number, excludeId?: string) =>
    `newsletters:top:${limit}:${excludeId || 'none'}`,
  subscriber: (email: string) => `subscriber:${email}`,
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate all newsletter-related caches
   */
  async invalidateAllNewsletters(): Promise<void> {
    await cache.delete(cacheKeys.newslettersAll());
    await cache.deletePattern('newsletters:top:*');
    await cache.deletePattern('newsletter:*');
  },

  /**
   * Invalidate specific newsletter caches
   */
  async invalidateNewsletter(id: string, slug?: string): Promise<void> {
    await cache.delete(cacheKeys.newsletter(id));
    if (slug) {
      await cache.delete(cacheKeys.newsletterBySlug(slug));
    }
    await cache.delete(cacheKeys.newslettersAll());
    await cache.deletePattern('newsletters:top:*');
  },

  /**
   * Invalidate newsletter list caches
   */
  async invalidateNewsletterLists(): Promise<void> {
    await cache.delete(cacheKeys.newslettersAll());
    await cache.deletePattern('newsletters:top:*');
  },
};
