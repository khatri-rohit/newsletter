// ==========================================
// CACHING SYSTEM - PRODUCTION GRADE
// ==========================================
// Multi-layer cache with Redis primary and memory fallback

import { getRedisClient } from './redis-client';

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  redisAvailable: boolean;
}

// ==========================================
// CACHE MANAGER
// ==========================================

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    redisAvailable: false,
  };

  private readonly NAMESPACE = 'newsletter';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MEMORY_CACHE_MAX_SIZE = 1000;
  private readonly MEMORY_CACHE_CLEANUP_INTERVAL = 60000; // 1 minute

  constructor() {
    this.startMemoryCacheCleanup();
  }

  // ==========================================
  // CORE CACHE OPERATIONS
  // ==========================================

  /**
   * Get value from cache (tries Redis first, falls back to memory)
   */
  async get<T>(key: string): Promise<T | null> {
    const namespacedKey = this.getNamespacedKey(key);

    // Try Redis first
    const redisResult = await this.getFromRedis<T>(namespacedKey);
    if (redisResult !== null) {
      this.stats.hits++;
      this.stats.redisAvailable = true;

      // Update memory cache as secondary layer
      this.setInMemory(namespacedKey, redisResult, this.DEFAULT_TTL);

      return redisResult;
    }

    // Fallback to memory cache
    const memoryResult = this.getFromMemory<T>(namespacedKey);
    if (memoryResult !== null) {
      this.stats.hits++;
      return memoryResult;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache (both Redis and memory)
   */
  async set<T>(key: string, value: T, ttlMs: number = this.DEFAULT_TTL): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key);

    // Always set in memory cache first (fast and reliable)
    this.setInMemory(namespacedKey, value, ttlMs);

    // Try to set in Redis (fire and forget)
    this.setInRedis(namespacedKey, value, ttlMs).catch((error) => {
      console.error('[Cache] Redis set failed, using memory cache only:', error.message);
      this.stats.errors++;
    });
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key);

    // Delete from memory
    this.memoryCache.delete(namespacedKey);

    // Try to delete from Redis
    try {
      const client = await getRedisClient();
      if (client) {
        await this.withTimeout(client.del(namespacedKey), 2000);
        this.stats.redisAvailable = true;
      }
    } catch (error) {
      console.error('[Cache] Redis delete failed:', error);
      this.stats.errors++;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    const namespacedPattern = this.getNamespacedKey(pattern);

    // Delete from memory cache
    const keysToDelete: string[] = [];
    for (const key of this.memoryCache.keys()) {
      if (this.matchPattern(key, namespacedPattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    // Try to delete from Redis
    try {
      const client = await getRedisClient();
      if (client) {
        const keys = await this.withTimeout(client.keys(namespacedPattern), 3000);
        if (keys.length > 0) {
          await this.withTimeout(client.del(keys as [string, ...string[]]), 3000);
        }
        this.stats.redisAvailable = true;
        console.log(`[Cache] Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error('[Cache] Redis pattern delete failed:', error);
      this.stats.errors++;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Try to clear Redis
    try {
      const client = await getRedisClient();
      if (client) {
        const keys = await this.withTimeout(client.keys(`${this.NAMESPACE}:*`), 3000);
        if (keys.length > 0) {
          await this.withTimeout(client.del(keys as [string, ...string[]]), 3000);
        }
        this.stats.redisAvailable = true;
        console.log(`[Cache] Cleared ${keys.length} Redis entries`);
      }
    } catch (error) {
      console.error('[Cache] Redis clear failed:', error);
      this.stats.errors++;
    }
  }

  // ==========================================
  // REDIS OPERATIONS
  // ==========================================

  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return null;
      }

      const value = await this.withTimeout(client.get(key), 2000);
      if (!value) {
        return null;
      }

      this.stats.redisAvailable = true;
      return JSON.parse(value) as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Only log non-timeout errors
      if (!errorMessage.includes('timeout')) {
        console.error('[Cache] Redis get failed:', errorMessage);
      }

      this.stats.errors++;
      this.stats.redisAvailable = false;
      return null;
    }
  }

  private async setInRedis<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return;
      }

      const serialized = JSON.stringify(value);
      const ttlSeconds = Math.ceil(ttlMs / 1000);

      await this.withTimeout(client.setEx(key, ttlSeconds, serialized), 2000);
      this.stats.redisAvailable = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Cache] Redis set failed:', errorMessage);
      this.stats.errors++;
      this.stats.redisAvailable = false;
      throw error; // Re-throw for caller to handle
    }
  }

  // ==========================================
  // MEMORY CACHE OPERATIONS
  // ==========================================

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setInMemory<T>(key: string, value: T, ttlMs: number): void {
    // Prevent memory cache from growing too large
    if (this.memoryCache.size >= this.MEMORY_CACHE_MAX_SIZE) {
      this.cleanupMemoryCache();
    }

    this.memoryCache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // If still too large, remove oldest entries
    if (this.memoryCache.size >= this.MEMORY_CACHE_MAX_SIZE) {
      const entriesToRemove = this.memoryCache.size - this.MEMORY_CACHE_MAX_SIZE + 100;
      const keys = Array.from(this.memoryCache.keys()).slice(0, entriesToRemove);
      keys.forEach((key) => this.memoryCache.delete(key));
      cleanedCount += entriesToRemove;
    }

    if (cleanedCount > 0) {
      console.log(`[Cache] Cleaned up ${cleanedCount} expired memory cache entries`);
    }
  }

  private startMemoryCacheCleanup(): void {
    setInterval(() => {
      this.cleanupMemoryCache();
    }, this.MEMORY_CACHE_CLEANUP_INTERVAL);
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private getNamespacedKey(key: string): string {
    return `${this.NAMESPACE}:${key}`;
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]');
    return new RegExp(`^${regexPattern}$`).test(key);
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { memoryCacheSize: number } {
    return {
      ...this.stats,
      memoryCacheSize: this.memoryCache.size,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      redisAvailable: this.stats.redisAvailable,
    };
  }
}

// ==========================================
// CACHE KEYS
// ==========================================

export const cacheKeys = {
  // Newsletter keys
  newsletter: (id: string) => `newsletter:${id}`,
  newsletterBySlug: (slug: string) => `newsletter:slug:${slug}`,
  newslettersList: (status?: string, authorId?: string) =>
    `newsletters:list:${status || 'all'}:${authorId || 'all'}`,
  newslettersTop: (limit: number, excludeId?: string) =>
    `newsletters:top:${limit}:${excludeId || 'none'}`,

  // Subscriber keys
  subscriber: (email: string) => `subscriber:${email}`,

  // Wildcard patterns
  allNewsletters: () => 'newsletter*',
  allNewsletterLists: () => 'newsletters:list:*',
  allNewsletterTops: () => 'newsletters:top:*',
};

// ==========================================
// CACHE INVALIDATION
// ==========================================

export const cacheInvalidation = {
  /**
   * Invalidate specific newsletter caches
   */
  async invalidateNewsletter(id: string, slug?: string): Promise<void> {
    await cache.delete(cacheKeys.newsletter(id));
    if (slug) {
      await cache.delete(cacheKeys.newsletterBySlug(slug));
    }
    // Invalidate lists and tops as they might contain this newsletter
    await cache.deletePattern(cacheKeys.allNewsletterLists());
    await cache.deletePattern(cacheKeys.allNewsletterTops());
    console.log(`[Cache] Invalidated newsletter: ${id}`);
  },

  /**
   * Invalidate newsletter list caches
   */
  async invalidateNewsletterLists(): Promise<void> {
    await cache.deletePattern(cacheKeys.allNewsletterLists());
    await cache.deletePattern(cacheKeys.allNewsletterTops());
    console.log('[Cache] Invalidated newsletter lists');
  },

  /**
   * Invalidate all newsletter-related caches
   */
  async invalidateAllNewsletters(): Promise<void> {
    await cache.deletePattern(cacheKeys.allNewsletters());
    console.log('[Cache] Invalidated all newsletter caches');
  },
};

// ==========================================
// EXPORTS
// ==========================================

export const cache = new CacheManager();
