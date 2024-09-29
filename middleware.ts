import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from 'next/server';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/events/:id',
    '/api/webhook/clerk',
    '/api/events',
    '/api/createOrder',
    '/events/:id/register',  // Add this line
    '/events/:id/thank-you', // Add this line
    '/event-lookup', // Add this line
    '/api/orders',
  ],
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/uploadthing',
  ],
  async afterAuth(auth, req) {
    if (auth.isPublicRoute) {
      return NextResponse.next();
    }

    const role = auth.sessionClaims?.role as string;

    if (req.nextUrl.pathname.startsWith('/api/')) {
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
  };

  return routeRoles[pathname] || ['user', 'admin', 'superadmin'];
}
