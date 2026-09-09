import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  if (['/login', '/signup', '/auth/callback'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/login', '/signup', '/auth/callback'] };
