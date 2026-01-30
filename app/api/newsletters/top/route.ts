import { NextRequest, NextResponse } from 'next/server';
import { NewsletterService } from '@/services/newsletter.service';
import { cache, cacheKeys } from '@/lib/cache';

const newsletterService = new NewsletterService();

/**
 * GET /api/newsletters/top
 * Get top newsletters based on views
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3');
    const excludeId = searchParams.get('excludeId') || undefined;

    // Validate limit
    if (limit < 1 || limit > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be between 1 and 10',
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = cacheKeys.newslettersTop(limit, excludeId);
    const cachedNewsletters = await cache.get(cacheKey);

    if (cachedNewsletters) {
      return NextResponse.json({
        success: true,
        data: cachedNewsletters,
      });
    }

    const newsletters = await newsletterService.getTopNewslettersByViews(limit, excludeId);

    // Cache for 10 minutes
    await cache.set(cacheKey, newsletters, 10 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: newsletters,
    });
  } catch (error) {
    console.error('Error fetching top newsletters:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top newsletters',
      },
      { status: 500 }
    );
  }
}
