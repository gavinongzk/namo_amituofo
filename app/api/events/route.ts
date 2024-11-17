import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/actions/event.actions';
import { unstable_cache } from 'next/cache';

export const runtime = 'edge';

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
    revalidate: 300, // Cache for 5 minutes
    tags: ['events']
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';

    const events = await getCachedEvents(country);
    
    return new NextResponse(JSON.stringify(events), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
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
