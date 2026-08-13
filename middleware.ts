import { authMiddleware } from "@clerk/nextjs";
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { rateLimiterMiddleware } from './lib/middleware/rateLimiter';

// Guest event/register URLs must skip Clerk's 401 interstitial. Facebook/WhatsApp
// in-app browsers block clerk.accounts.dev, so the handshake looks like "Page not found".
// Keep /events/details/:id/update protected (admin).
function shouldBypassClerkHandshake(pathname: string): boolean {
  if (
    pathname === '/api/createOrder' ||
    pathname === '/api/check-phone-numbers'
  ) {
    return true;
  }

  return (
    /^\/events\/details\/[^/]+$/.test(pathname) ||
    /^\/events\/details\/[^/]+\/register$/.test(pathname)
  );
}

const clerkAuth = authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/events/:id',
    '/events/details/:id',
    '/events/details/:id/register',
    '/api/webhook/clerk',
    '/api/events',
    '/api/events/selection',
    '/api/events/public-selection',
    '/api/createOrder',
    '/api/check-phone-numbers',
    '/events/:id/register',
    '/events/:id/thank-you',
    '/event-lookup',
    '/api/reg',
    '/api/reg/:id',
    '/api/update-registration',
    '/api/cancel-registration',
    '/api/all-registrations',
    '/api/batch',
    '/api/categories',
    '/monitoring',
    '/reg/:id',
    '/volunteer-recruitment',
    '/clapping-exercise-volunteer',
    '/api/volunteer-registration',
    '/api/clapping-exercise-volunteer',
    '/api/debug-events',
    '/api/test-order'
  ],
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/uploadthing',
    '/monitoring',
    '/api/volunteer-registration',
    '/api/clapping-exercise-volunteer',
    '/api/debug-events',
    '/api/test-order',
    '/api/createOrder',
    '/api/check-phone-numbers',
    '/events/details/:id',
    '/events/details/:id/register',
  ],
  async beforeAuth(req) {
    // Apply rate limiting before authentication
    const path = req.nextUrl.pathname;
    
    // Skip rate limiting for static assets, non-API routes, and monitoring
    if (
      path.startsWith('/_next') || 
      path.startsWith('/static') ||
      path.endsWith('.ico') ||
      path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path === '/monitoring'
    ) {
      return NextResponse.next();
    }

    // Determine rate limit type based on the request
    const isStrictLimit = path.includes('/api/') && (
      path.includes('createOrder') ||
      path.includes('update-registration') ||
      path.includes('cancel-registration') ||
      path.includes('attendance') ||
      path.includes('users')
    );

    const isStaticContent = path.includes('/events') && !path.includes('/api/');

    // Apply rate limiting
    const rateLimitResult = await rateLimiterMiddleware(
      req,
      isStrictLimit,
      isStaticContent
    );

    if (rateLimitResult) {
      return rateLimitResult;
    }

    return NextResponse.next();
  },
  async afterAuth(auth, req) {
    if (auth.isPublicRoute) {
      return NextResponse.next();
    }

    if (req.nextUrl.pathname.startsWith('/admin/') && !auth.userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    const role = auth.sessionClaims?.role as string;

    if ((req.nextUrl.pathname.startsWith('/api/')) || (req.nextUrl.pathname.startsWith('/admin/'))) {
      const allowedRoles = getAllowedRoles(req.nextUrl.pathname);
      if (!allowedRoles.includes(role)) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return NextResponse.next();
  }
});

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;

  if (shouldBypassClerkHandshake(pathname)) {
    if (pathname.startsWith('/api/')) {
      const rateLimitResult = await rateLimiterMiddleware(req, true, false);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    }
    return NextResponse.next();
  }

  return clerkAuth(req, event);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

function getAllowedRoles(pathname: string): string[] {
  const routeRoles: { [key: string]: string[] } = {
    '/api/users/update-role': ['superadmin'],
    '/api/attendance': ['superadmin', 'admin'],
    '/api/delete-registration': ['superadmin'],
    '/api/events/:id/attendees': ['superadmin'],
    '/api/download-users-csv': ['superadmin'],
    '/admin/events_archive': ['superadmin'],
    '/admin/upload_orders': ['superadmin'],
    '/admin/users': ['superadmin'],
    '/admin/analytics': ['superadmin'],
    '/api/events/:id/max-seats': ['superadmin'],
    '/admin/always-add-users': ['superadmin'],
    '/api/admin/always-add-users': ['superadmin'],
  };

  return routeRoles[pathname] || ['user', 'admin', 'superadmin'];
}
