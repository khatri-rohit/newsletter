import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getRedisHealth, getRedisMetrics } from '@/lib/redis-client';

/**
 * GET /api/health
 * Comprehensive health check endpoint for monitoring and load balancers
 */
export async function GET(request: NextRequest) {
  const checks: Record<string, boolean> = {
    server: true,
    firebase: false,
    redis: false,
  };

  const details: Record<string, unknown> = {};

  // Check Firebase connection
  try {
    const admin = getFirebaseAdmin();
    if (admin) {
      checks.firebase = true;
      details.firebase = { status: 'connected' };
    }
  } catch (error) {
    console.error('[Health] Firebase check failed:', error);
    details.firebase = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Redis connection - ACTIVELY test the connection
  try {
    const { getRedisClient } = await import('@/lib/redis-client');
    const redisHealth = getRedisHealth();
    const redisMetrics = getRedisMetrics();

    // Attempt to get client and ping (this triggers connection if not connected)
    let canConnect = false;
    try {
      const client = await getRedisClient();
      if (client && client.isOpen) {
        await client.ping();
        canConnect = true;
      }
    } catch (pingError) {
      console.error('[Health] Redis ping failed:', pingError);
      canConnect = false;
    }

    checks.redis = canConnect && redisHealth.isHealthy;
    details.redis = {
      status: canConnect && redisHealth.isHealthy ? 'healthy' : 'degraded',
      health: redisHealth,
      canConnect,
      metrics: {
        totalConnections: redisMetrics.totalConnections,
        failedConnections: redisMetrics.failedConnections,
        successRate:
          redisMetrics.totalConnections > 0
            ? (
                ((redisMetrics.totalConnections - redisMetrics.failedConnections) /
                  redisMetrics.totalConnections) *
                100
              ).toFixed(2) + '%'
            : 'N/A',
      },
    };
  } catch (error) {
    console.error('[Health] Redis check failed:', error);
    details.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const allHealthy = Object.values(checks).every((check) => check);
  const criticalHealthy = checks.server && checks.firebase; // Redis is optional

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : criticalHealthy ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      details,
      system: {
        uptime: process.uptime(),
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
        node: process.version,
        platform: process.platform,
      },
    },
    {
      status: allHealthy ? 200 : criticalHealthy ? 503 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
