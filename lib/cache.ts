// ==========================================
// CACHING UTILITY WITH REDIS
// ==========================================

import { getRedisClient, isRedisAvailable } from './redis';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<unknown>>;
  private useRedis: boolean = false;

  constructor() {
    this.memoryCache = new Map();
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection asynchronously
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.useRedis = await isRedisAvailable();
      if (this.useRedis) {
        console.log('[Cache] Using Redis for caching');
      } else {
        console.log('[Cache] Redis not available, using in-memory cache');
      }
    } catch (error) {
      console.error('[Cache] Redis initialization failed:', error);
      this.useRedis = false;
    }
  }

  /**
   * Set a cache entry with TTL (in milliseconds)
   */
  async set<T>(key: string, data: T, ttl: number = 60000): Promise<void> {
    try {
      if (this.useRedis) {
        const client = await getRedisClient();
        const ttlSeconds = Math.ceil(ttl / 1000);
        await client.setEx(key, ttlSeconds, JSON.stringify(data));
      } else {
        this.memoryCache.set(key, {
          data,
          timestamp: Date.now(),
          ttl,
        });
      }
    } catch (error) {
      console.error('[Cache] Error setting cache:', error);
      // Fallback to memory cache
      this.memoryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    }
  }

  /**
   * Get a cache entry
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis) {
        const client = await getRedisClient();
        const value = await client.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } else {
        const entry = this.memoryCache.get(key);

        if (!entry) {
          return null;
        }

        const age = Date.now() - entry.timestamp;

        if (age > entry.ttl) {
          this.memoryCache.delete(key);
          return null;
        }

        return entry.data as T;
      }
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
      if (this.useRedis) {
        const client = await getRedisClient();
        const exists = await client.exists(key);
        return exists === 1;
      } else {
        const entry = this.memoryCache.get(key);

        if (!entry) {
          return false;
        }

        const age = Date.now() - entry.timestamp;

        if (age > entry.ttl) {
          this.memoryCache.delete(key);
          return false;
        }

        return true;
      }
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
      if (this.useRedis) {
        const client = await getRedisClient();
        await client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('[Cache] Error deleting cache:', error);
      // Also try memory cache as fallback
      this.memoryCache.delete(key);
    }
  }

  /**
   * Delete multiple cache entries by pattern
   * Useful for invalidating related cache entries
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.useRedis) {
        const client = await getRedisClient();
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(keys);
          console.log(`[Cache] Deleted ${keys.length} keys matching pattern: ${pattern}`);
        }
      } else {
        // For memory cache, manually match pattern
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const keysToDelete: string[] = [];

        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            keysToDelete.push(key);
          }
        }

        keysToDelete.forEach((key) => this.memoryCache.delete(key));
        if (keysToDelete.length > 0) {
          console.log(`[Cache] Deleted ${keysToDelete.length} keys matching pattern: ${pattern}`);
        }
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
      if (this.useRedis) {
        const client = await getRedisClient();
        // Only delete keys with our namespace prefix to avoid affecting other apps
        const keys = await client.keys('newsletter:*');
        if (keys.length > 0) {
          await client.del(keys);
          console.log(`[Cache] Cleared ${keys.length} newsletter cache entries`);
        }
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
      this.memoryCache.clear();
    }
  }

  /**
   * Cleanup expired entries (only relevant for memory cache)
   */
  cleanup(): void {
    if (!this.useRedis) {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        const age = now - entry.timestamp;
        if (age > entry.ttl) {
          this.memoryCache.delete(key);
        }
      }
    }
    // Redis handles TTL automatically, no cleanup needed
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; type: 'redis' | 'memory' }> {
    try {
      if (this.useRedis) {
        const client = await getRedisClient();
        const keys = await client.keys('newsletter:*');
        return { keys: keys.length, type: 'redis' };
      } else {
        return { keys: this.memoryCache.size, type: 'memory' };
      }
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return { keys: this.memoryCache.size, type: 'memory' };
    }
  }
}

// Create cache instance
export const cache = new CacheManager();

// Cleanup every 5 minutes (only for memory cache)
setInterval(
  () => {
    cache.cleanup();
  },
  5 * 60 * 1000
);

// Cache key generators
export const cacheKeys = {
  newsletter: (id: string) => `newsletter:${id}`,
  newsletterBySlug: (slug: string) => `newsletter:slug:${slug}`,
  newsletters: (filters: string) => `newsletters:${filters}`,
  newslettersList: (status?: string, authorId?: string) =>
    `newsletters:list:${status || 'all'}:${authorId || 'all'}`,
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
    await cache.deletePattern('newsletter*');
  },

  /**
   * Invalidate specific newsletter caches
   */
  async invalidateNewsletter(id: string, slug?: string): Promise<void> {
    await cache.delete(cacheKeys.newsletter(id));
    if (slug) {
      await cache.delete(cacheKeys.newsletterBySlug(slug));
    }
    // Also invalidate lists as they might contain this newsletter
    await cache.deletePattern('newsletters:list:*');
    await cache.deletePattern('newsletters:top:*');
  },

  /**
   * Invalidate newsletter list caches
   */
  async invalidateNewsletterLists(): Promise<void> {
    await cache.deletePattern('newsletters:list:*');
    await cache.deletePattern('newsletters:top:*');
  },
};
