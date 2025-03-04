import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const handleCustomMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Match URLs like /events/2024-03-20
  const eventUrlPattern = /^\/events\/(\d{4}-\d{2}-\d{2})$/;
  const match = pathname.match(eventUrlPattern);

  // Handle old format URLs (redirect them)
  const oldFormatPattern = /^\/events\/(\d{4}-\d{2}-\d{2})\/(\d{2}-\d{2}-\d{4})$/;
  const oldMatch = pathname.match(oldFormatPattern);
  
  if (oldMatch) {
    // Extract date from old format and redirect to new simple format
    const [_, isoDate] = oldMatch;
    return NextResponse.redirect(new URL(`/events/${isoDate}`, request.url));
  }

  if (match) {
    try {
      const [_, date] = match;
      const response = await fetch(`${request.nextUrl.origin}/api/events/lookup?date=${date}`);
      const data = await response.json();
      
      if (data.eventId) {
        const url = request.nextUrl.clone();
        url.pathname = `/events/${data.eventId}`;
        return NextResponse.rewrite(url);
      }
    } catch (error) {
      console.error('Error in middleware:', error);
    }
  }

  return null;
};

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
    const customResponse = await handleCustomMiddleware(req);
    if (customResponse) return customResponse;
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
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
    '/events/:path*'
  ]
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
