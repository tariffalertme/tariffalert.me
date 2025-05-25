import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that should be cached
const CACHE_PATHS = [
  '/products',
  '/news',
  '/countries',
  '/api/sanity/news',
  '/api/sanity/products',
  '/api/sanity/countries'
]

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Add caching headers for static paths
  if (CACHE_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    // Cache successful responses for 1 hour
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  }

  return response
}

// Configure paths that should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 