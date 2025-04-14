import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware() {
  // Add your middleware logic here
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}; 