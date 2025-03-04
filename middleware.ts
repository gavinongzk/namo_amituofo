import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
    '/api/events/:id/max-seats': ['superadmin'],
  };

  return routeRoles[pathname] || ['user', 'admin', 'superadmin'];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Match URLs like /events/category/2024-03-20/event-title
  const eventUrlPattern = /^\/events\/([^\/]+)\/(\d{4}-\d{2}-\d{2})\/([^\/]+)$/
  const match = pathname.match(eventUrlPattern)

  if (match) {
    try {
      // Extract the components from the URL
      const [_, category, date, title] = match
      
      // Fetch the actual event ID from your API
      const response = await fetch(`${request.nextUrl.origin}/api/events/lookup?category=${category}&date=${date}&title=${title}`)
      const data = await response.json()
      
      if (data.eventId) {
        // Rewrite to the ID-based URL internally
        const url = request.nextUrl.clone()
        url.pathname = `/events/${data.eventId}`
        return NextResponse.rewrite(url)
      }
    } catch (error) {
      console.error('Error in middleware:', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/events/:path*',
}
