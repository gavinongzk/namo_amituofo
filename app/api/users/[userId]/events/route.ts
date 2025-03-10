import { NextRequest, NextResponse } from 'next/server';
import { getEventsByUser } from '@/lib/actions/event.actions';
import { auth } from '@clerk/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    // Get the current user's session
    const { sessionClaims } = auth();
    const userRole = sessionClaims?.metadata?.role as string;
    const currentUserId = sessionClaims?.metadata?.userId as string;

    // Check if user is authorized
    if (!currentUserId || (userRole !== 'admin' && userRole !== 'superadmin')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only allow users to fetch their own events unless they're a superadmin
    if (params.userId !== currentUserId && userRole !== 'superadmin') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const events = await getEventsByUser({ 
      userId: params.userId,
      page,
      limit
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching user events:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 