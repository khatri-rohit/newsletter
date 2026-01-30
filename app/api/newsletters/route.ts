import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { NewsletterService } from '@/services/newsletter.service';
import { cache, cacheKeys } from '@/lib/cache';

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

async function authenticate(
  req: NextRequest
): Promise<{ userId: string; role: string; email?: string }> {
  // Extract token from Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  if (!token) {
    throw new Error('Missing authentication token');
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Extract user information from the decoded token
    const userId = decodedToken.uid;
    const email = decodedToken.email;

    const role = (decodedToken.role as string) || 'user';

    return {
      userId,
      email,
      role,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Provide specific error messages for common Firebase Auth errors
      if (error.message.includes('expired')) {
        throw new Error('Token has expired');
      }
      if (error.message.includes('invalid')) {
        throw new Error('Invalid authentication token');
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error('Authentication failed');
  }
}

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

    if (status !== 'published') {
      const { role } = await authenticate(request);
      if (role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden - Admin access required',
            message: 'Admin access required',
          },
          { status: 403 }
        );
      }
    }

    // Create cache key based on filters
    const cacheKey = cacheKeys.newslettersList(status || undefined, authorId || undefined);

    // Check cache first (only for published newsletters without pagination)
    if (status === 'published' && !startAfter) {
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        const response = NextResponse.json({
          success: true,
          data: cachedResult,
        });
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        response.headers.set('X-Cache', 'HIT');
        return response;
      }
    }

    const result = await newsletterService.listNewsletters({
      status: status || undefined,
      authorId: authorId || undefined,
      limit,
      startAfter: startAfter || undefined,
    });

    // Cache published newsletters list (5 minutes)
    if (status === 'published' && !startAfter) {
      await cache.set(cacheKey, result, 5 * 60 * 1000);
    }

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    // Add cache headers for published newsletters
    if (status === 'published') {
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      response.headers.set('X-Cache', 'MISS');
    }

    return response;
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

// Enable edge runtime for better performance
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // This can be changed to 'force-static' for even better performance if data doesn't change often

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

    // Convert scheduledFor from string to Date if present
    const newsletterData = {
      ...body,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    };

    const newsletter = await newsletterService.createNewsletter(newsletterData, {
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
