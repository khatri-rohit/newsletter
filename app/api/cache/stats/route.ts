import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { getRedisHealth, getRedisMetrics } from '@/lib/redis-client';

/**
 * GET /api/cache/stats
 * Get comprehensive cache statistics, Redis health, and metrics
 */
export async function GET() {
  try {
    const cacheStats = cache.getStats();
    const redisHealth = getRedisHealth();
    const redisMetrics = getRedisMetrics();

    const uptimeSeconds = Math.floor(redisMetrics.uptime / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);

    return NextResponse.json({
      success: true,
      data: {
        cache: {
          ...cacheStats,
          hitRate:
            cacheStats.hits + cacheStats.misses > 0
              ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%'
              : 'N/A',
        },
        redis: {
          health: redisHealth,
          metrics: {
            ...redisMetrics,
            uptimeFormatted: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`,
            successRate:
              redisMetrics.totalConnections > 0
                ? (
                    ((redisMetrics.totalConnections - redisMetrics.failedConnections) /
                      redisMetrics.totalConnections) *
                    100
                  ).toFixed(2) + '%'
                : 'N/A',
            operationSuccessRate:
              redisMetrics.successfulOperations + redisMetrics.failedOperations > 0
                ? (
                    (redisMetrics.successfulOperations /
                      (redisMetrics.successfulOperations + redisMetrics.failedOperations)) *
                    100
                  ).toFixed(2) + '%'
                : 'N/A',
          },
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    console.error('[Cache Stats API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cache stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
