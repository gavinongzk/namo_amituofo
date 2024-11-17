import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/actions/event.actions';
import { unstable_cache } from 'next/cache';

const getCachedEvents = unstable_cache(
  async (country: string) => {
    return getAllEvents({
      query: '',
      category: '',
      page: 1,
      limit: 1000,
      country: country
    });
  },
  ['api-events-list'],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ['events']
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';

    const events = await getCachedEvents(country);
    
    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Failed to fetch events' }, 
      { status: 500 }
    );
  }
}
