import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

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
    const url = new URL(req.url);
    const isAdminRoute = url.pathname.startsWith('/admin') || 
                         url.pathname.startsWith('/api/admin');
    const isSuperAdminRoute = url.pathname.startsWith('/api/users/update-role');

    if (!auth.userId && isAdminRoute) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    if (auth.isPublicRoute) {
      return NextResponse.next();
    }

    const user = auth.user;

    if (isAdminRoute && user?.publicMetadata?.role !== 'admin' && user?.publicMetadata?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (isSuperAdminRoute && user?.publicMetadata?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
