// ==========================================
// HEALTH CHECK API ENDPOINT
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 */
export async function GET(request: NextRequest) {
  const checks: Record<string, boolean> = {
    server: true,
    firebase: false,
  };

  try {
    // Check Firebase connection
    const admin = getFirebaseAdmin();
    if (admin) {
      checks.firebase = true;
    }
  } catch (error) {
    console.error('Firebase health check failed:', error);
  }

  const allHealthy = Object.values(checks).every((check) => check);

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
