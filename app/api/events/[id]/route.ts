import { NextResponse } from 'next/server';
import { getEventById } from '@/lib/actions/event.actions';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await getEventById(params.id);

    if (!event) {
      return new NextResponse(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
      });
    }

    return new NextResponse(JSON.stringify(event), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache the response for 1 hour
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
} 