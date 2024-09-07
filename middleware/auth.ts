import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';

export async function withAuth(
  req: NextRequest,
  allowedRoles: string[],
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;

  if (!user || !allowedRoles.includes(role)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return handler(req);
}