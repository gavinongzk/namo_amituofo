import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { rateLimiterMiddleware } from './lib/middleware/rateLimiter';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/events/:id',
    '/api/webhook/clerk',
    '/api/events',
    '/api/createOrder',
    '/api/check-phone-numbers',
    '/events/:id/register',
    '/events/:id/thank-you',
    '/event-lookup',
    '/api/reg',
    '/api/update-registration',
    '/api/cancel-registration',
    '/monitoring',
  ],
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/uploadthing',
    '/monitoring',
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
  };

  return routeRoles[pathname] || ['user', 'admin', 'superadmin'];
}
