import { authMiddleware } from "@clerk/nextjs";
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/events/:id',
    '/api/webhook/clerk',
    '/api/uploadthing',
    '/api/events'
  ],
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/uploadthing'
  ],
  async afterAuth(auth, req) {
    // Custom logic after Clerk's authentication
    if (auth.isPublicRoute) {
      return NextResponse.next();
    }

    const user = await currentUser();
    const role = user?.publicMetadata.role as string;

    // Check if the route requires specific roles
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
  // Define your route-role mappings here
  const routeRoles: { [key: string]: string[] } = {
    '/api/users/update-role': ['superadmin'],
    '/api/attendance': ['superadmin', 'admin'],
    // Add more route-role mappings as needed
  };

  return routeRoles[pathname] || ['user', 'admin', 'superadmin'];
}
