import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { getEventById } from '@/lib/actions/event.actions';
import { formatDateForUrl } from '@/lib/utils';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/events/:date',
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
    // Check if the request is for an event page with an ID
    const eventIdMatch = req.nextUrl.pathname.match(/^\/events\/([a-f0-9]{24})$/i);
    if (eventIdMatch) {
      try {
        const eventId = eventIdMatch[1];
        const event = await getEventById(eventId);
        
        if (event) {
          // Format the date for the URL (YYYY-MM-DD)
          const dateStr = formatDateForUrl(new Date(event.startDateTime));
          
          // Redirect to the date-based URL
          return NextResponse.redirect(new URL(`/events/${dateStr}`, req.url));
        }
      } catch (error) {
        console.error('Error in event redirect:', error);
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
    '/api/events/:id/max-seats': ['superadmin'],
  };

  return routeRoles[pathname] || ['user', 'admin', 'superadmin'];
}
