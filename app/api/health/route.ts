import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * GET /api/health
 * Comprehensive health check endpoint for monitoring and load balancers
 */
export async function GET(request: NextRequest) {
  const checks: Record<string, boolean> = {
    server: true,
    firebase: false,
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

  const allHealthy = Object.values(checks).every((check) => check);

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
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
      status: allHealthy ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
