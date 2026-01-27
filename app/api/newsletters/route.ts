import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { NewsletterService } from '@/services/newsletter.service';

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
 * GET /api/newsletters
 * List newsletters with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'draft' | 'published' | 'scheduled' | null;
    const authorId = searchParams.get('authorId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startAfter = searchParams.get('startAfter');

    const result = await newsletterService.listNewsletters({
      status: status || undefined,
      authorId: authorId || undefined,
      limit,
      startAfter: startAfter || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch newsletters',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/newsletters
 * Create a new newsletter
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('[Newsletter API] Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Newsletter API] Invalid auth header format');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('[Newsletter API] Verifying token...');

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('[Newsletter API] Token verified:', {
        uid: decodedToken.uid,
        role: decodedToken.role,
      });
    } catch (tokenError) {
      console.error('[Newsletter API] Token verification failed:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (decodedToken.role !== 'admin') {
      console.error('[Newsletter API] User is not admin:', decodedToken.uid);
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('[Newsletter API] Creating newsletter:', {
      title: body.title,
      status: body.status,
    });

    const newsletter = await newsletterService.createNewsletter(body, {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      displayName: decodedToken.name,
    });

    console.log('[Newsletter API] Newsletter created successfully:', newsletter.id);
    return NextResponse.json({
      success: true,
      data: newsletter,
    });
  } catch (error) {
    console.error('[Newsletter API] Error creating newsletter:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create newsletter',
      },
      { status: 500 }
    );
  }
}
