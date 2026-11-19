import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/', '/_next', '/api'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Allow public paths without token check
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // For protected routes, let the client-side handle auth
  // Server-side middleware can't access localStorage
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
