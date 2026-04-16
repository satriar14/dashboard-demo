import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy function (Next.js 16)
 * Replaces the traditional middleware.ts convention.
 * Reflects the network boundary and routing focus.
 */
export function proxy(request: NextRequest) {
  // Allow all requests to proceed to their destination
  return NextResponse.next();
}

// See "Proxying" in Next.js docs for more about matcher.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
