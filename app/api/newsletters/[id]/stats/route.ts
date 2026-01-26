import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getEmailTrackingService } from '@/services/email-tracking.service';

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const emailTrackingService = getEmailTrackingService();

/**
 * GET /api/newsletters/[id]/stats
 * Get email delivery statistics for a published newsletter
 *
 * Requires admin authentication
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if user is admin
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get detailed campaign summary
    const summary = await emailTrackingService.getCampaignSummary(id);

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'No email delivery data found for this newsletter' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching newsletter stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch newsletter statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
