// ==========================================
// REDIS LEGACY COMPATIBILITY LAYER
// ==========================================
// Provides backward compatibility for existing code
// All new code should import from redis-client.ts directly

import {
  getRedisClient as getClient,
  getRedisHealth,
  getRedisMetrics,
  disconnectRedis,
  isRedisAvailable,
  redisManager,
} from './redis-client';

// Legacy exports for backward compatibility
export const getRedisClient = getClient;
export { getRedisHealth, disconnectRedis, isRedisAvailable };

// Type re-export
export type RedisClient = Awaited<ReturnType<typeof getClient>>;

/**
 * @deprecated Use isRedisAvailable() instead
 */
export async function isRedisHealthy(): Promise<boolean> {
  return isRedisAvailable();
}

/**
 * Flush all Redis data (use with extreme caution!)
 */
export async function flushRedis(): Promise<void> {
  const client = await getClient();
  if (!client) {
    throw new Error('Redis client not available');
  }
  await client.flushAll();
  console.log('[Redis] All data flushed');
}

/**
 * Get detailed Redis status for monitoring
 */
export async function getRedisStatus() {
  const health = getRedisHealth();
  const metrics = getRedisMetrics();

  return {
    health,
    metrics,
    isAvailable: isRedisAvailable(),
    timestamp: new Date().toISOString(),
  };
}

// Re-export manager for advanced usage
export { redisManager };
