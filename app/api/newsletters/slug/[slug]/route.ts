import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { NewsletterService } from '@/services/newsletter.service';
import { cache, cacheKeys } from '@/lib/cache';
import { apiLimiter, getClientIdentifier } from '@/lib/rate-limit';
import { slugSchema } from '@/lib/validation';
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
 * GET /api/newsletters/slug/[slug]
 * Get a newsletter by slug and increment views
 * Includes rate limiting and caching
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Validate slug
    const slugValidation = slugSchema.safeParse(slug);
    if (!slugValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid slug format',
          details: slugValidation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = apiLimiter.check(30, identifier); // 30 requests per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Check cache first
    const cacheKey = cacheKeys.newsletterBySlug(slug);
    const cachedNewsletter = cache.get(cacheKey) as Newsletter | undefined;

    if (cachedNewsletter) {
      // Still increment views asynchronously
      if (cachedNewsletter.id) {
        newsletterService.incrementViews(cachedNewsletter.id).catch((error) => {
          console.error('Error incrementing views:', error);
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: cachedNewsletter,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'X-Cache': 'HIT',
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          },
        }
      );
    }

    // Fetch from database
    const newsletter = await newsletterService.getNewsletterBySlug(slug);

    if (!newsletter) {
      return NextResponse.json({ success: false, error: 'Newsletter not found' }, { status: 404 });
    }

    // Only show published newsletters to public
    if (newsletter.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Newsletter not available' },
        { status: 404 }
      );
    }

    // Cache the result (5 minutes TTL)
    cache.set(cacheKey, newsletter, 5 * 60 * 1000);

    // Increment views asynchronously (fire and forget)
    if (newsletter.id) {
      newsletterService.incrementViews(newsletter.id).catch((error) => {
        console.error('Error incrementing views:', error);
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: newsletter,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'MISS',
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error fetching newsletter by slug:', error);

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error tracking service here (e.g., Sentry)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch newsletter',
      },
      { status: 500 }
    );
  }
}
