import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export function middleware(request: NextRequest) {
  const requestStart = Date.now();
  const response = NextResponse.next();

  // Add response headers for monitoring
  response.headers.set('Server-Timing', `total;dur=${Date.now() - requestStart}`);
  response.headers.set('X-Response-Time', `${Date.now() - requestStart}ms`);

  // Track API performance
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const transaction = Sentry.startTransaction({
      name: `${request.method} ${request.nextUrl.pathname}`,
      op: 'http.server',
    });

    // Add request data to the transaction
    transaction.setData('query', request.nextUrl.search);
    transaction.setData('headers', Object.fromEntries(request.headers));

    // Finish the transaction
    transaction.finish();
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all page routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 