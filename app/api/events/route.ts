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
    revalidate: 3600,
    tags: ['events']
  }
);

const COMMON_COUNTRIES = ['Singapore', 'Malaysia'];
const preloadEvents = () => {
  COMMON_COUNTRIES.forEach(country => {
    void getCachedEvents(country);
  });
};

preloadEvents();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';

    const nextCountry = COMMON_COUNTRIES.find(c => c !== country);
    if (nextCountry) {
      void getCachedEvents(nextCountry);
    }

    const events = await getCachedEvents(country);
    
    return new NextResponse(JSON.stringify(events), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
        'Vercel-CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
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
