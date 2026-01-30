import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { NewsletterService } from '@/services/newsletter.service';
import { cache, cacheKeys } from '@/lib/cache';
import { Newsletter } from '@/services/types';

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

const newsletterService = new NewsletterService();

/**
 * GET /api/newsletters/[id]
 * Get a specific newsletter
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const cacheKey = cacheKeys.newslettersAll();
    const cachedAll = await cache.get<Newsletter[]>(cacheKey);

    if (cachedAll) {
      const cachedNewsletter = cachedAll.find((newsletter) => newsletter.id === id);
      if (cachedNewsletter) {
        return NextResponse.json({
          success: true,
          data: cachedNewsletter,
        });
      }
    }

    const newsletter = await newsletterService.getNewsletter(id);

    if (!newsletter) {
      return NextResponse.json({ success: false, error: 'Newsletter not found' }, { status: 404 });
    }

    // Merge into all-newsletters cache if published
    if (newsletter.status === 'published') {
      let mergedList = cachedAll;

      if (!mergedList) {
        const publishedResult = await newsletterService.listNewsletters({
          status: 'published',
          limit: 1000,
        });
        mergedList = publishedResult.newsletters;
      }

      const existingIndex = mergedList.findIndex((item) => item.id === newsletter.id);
      if (existingIndex >= 0) {
        mergedList[existingIndex] = newsletter;
      } else {
        mergedList.unshift(newsletter);
      }

      await cache.set(cacheKey, mergedList, 5 * 60 * 1000);
    }

    return NextResponse.json({
      success: true,
      data: newsletter,
    });
  } catch (error) {
    console.error('Error fetching newsletter:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch newsletter',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/newsletters/[id]
 * Update a newsletter
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json();

    // Convert scheduledFor from string to Date if present
    const updateData = { ...body };
    if (body.scheduledFor !== undefined) {
      updateData.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    }

    const newsletter = await newsletterService.updateNewsletter({
      id,
      ...updateData,
    });

    return NextResponse.json({
      success: true,
      data: newsletter,
    });
  } catch (error) {
    console.error('Error updating newsletter:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update newsletter',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/newsletters/[id]
 * Delete a newsletter
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    await newsletterService.deleteNewsletter(id);

    return NextResponse.json({
      success: true,
      message: 'Newsletter deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete newsletter',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/newsletters/[id]
 * Handle newsletter actions (like incrementing views)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'incrementViews') {
      const { viewerId } = body;

      if (!viewerId) {
        return NextResponse.json(
          { success: false, error: 'Viewer ID is required' },
          { status: 400 }
        );
      }

      const result = await newsletterService.incrementViews(id, viewerId);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing newsletter action:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process action',
      },
      { status: 500 }
    );
  }
}
