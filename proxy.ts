import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Add cache headers for static assets
  if (
    request.nextUrl.pathname.startsWith('/_next/static') ||
    request.nextUrl.pathname.includes('/fonts/') ||
    request.nextUrl.pathname.includes('.webmanifest') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|avif)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Add cache headers for API routes with shorter TTL
  if (request.nextUrl.pathname.startsWith('/api/newsletters')) {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that need custom handling)
     * - _next/webpack-hmr (dev hot reload)
     */
    '/((?!api/(?!newsletters)|_next/webpack-hmr).*)',
  ],
};
