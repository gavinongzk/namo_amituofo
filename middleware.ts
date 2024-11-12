import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter with monastery-appropriate limits
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
  analytics: true,
  prefix: "monastery_app",
});

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
    '/api/orders',
    '/api/update-registration',
    '/api/cancel-registration',
  ],
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/uploadthing',
  ],
  async beforeAuth(req) {
    // Apply rate limiting to registration and API endpoints
    if (req.nextUrl.pathname.includes('/api/') || 
        req.nextUrl.pathname.includes('/register')) {
      const ip = req.ip ?? "127.0.0.1";
      const { success, pending, limit, reset, remaining } = await ratelimit.limit(
        `${req.nextUrl.pathname}_${ip}`
      );
      
      if (!success) {
        return new NextResponse("Too many requests. Please try again later.", {
          status: 429,
          headers: {
            "Retry-After": reset.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
          },
        });
      }
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
    '/api/cancel-registration': ['superadmin', 'admin'],
    '/api/delete-registration': ['superadmin'],
    '/api/events/:id/attendees': ['superadmin'],
    '/api/download-users-csv': ['superadmin'],
    '/admin/events_archive': ['superadmin'],
    '/admin/upload_orders': ['superadmin'],
    '/admin/users': ['superadmin'],
    '/admin/analytics': ['superadmin'],
    '/api/events/:eventId/max-seats': ['superadmin'],
  };

  return routeRoles[pathname] || ['user', 'admin', 'superadmin'];
}
