import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/wallet',
  '/bookings',
  '/messages',
  '/admin',
  '/offers/create',
  '/requests/create',
  '/onboarding',
];

const GUEST_ONLY_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get('timeswap_session')?.value;
  const isAuthenticated = Boolean(sessionCookie && sessionCookie.trim().length > 0);

  // Check if target path starts with any protected prefix
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // Check if target path starts with any guest-only prefix
  const isGuestRoute = GUEST_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // 1. Guard protected routes against unauthenticated callers
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users away from guest routes
  if (isGuestRoute && isAuthenticated) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API endpoints)
     * - images, icons, fonts (public static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|images|icons|fonts).*)',
  ],
};
