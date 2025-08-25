import { NextRequest, NextResponse } from 'next/server';
import { getEventsForSelection } from '@/lib/actions/event.actions';
import { auth } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'Singapore';
    const { userId } = await auth();
    
    // Get user role from metadata if available
    const role = userId ? 'admin' : undefined; // Simplified for now
    
    const events = await getEventsForSelection({ country, role });
    
    return new NextResponse(JSON.stringify({ data: events }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('Error fetching events for selection:', error);
    return NextResponse.json(
      { message: 'Failed to fetch events', data: [] }, 
      { status: 500 }
    );
  }
}
