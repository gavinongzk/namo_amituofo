import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/actions/event.actions';
import { getCookie } from 'cookies-next';

export async function GET(request: NextRequest) {
  try {
    // Get the country from the cookie
    const country = getCookie('country', { req: request }) || 'US'; // Default to 'US' if not set

    const events = await getAllEvents({
      query: '',
      category: '',
      page: 1,
      limit: 1000,
      country: country as string // Add the country to the query
    });
    console.log('Fetched Events:', events);
    
    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}
