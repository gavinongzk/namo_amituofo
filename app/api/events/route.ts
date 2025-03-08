import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, getAllEventsForSuperAdmin } from '@/lib/actions/event.actions';
import { unstable_cache } from 'next/cache';
import { IEvent } from '@/lib/database/models/event.model';
import { auth } from '@clerk/nextjs';
import { revalidateTag } from 'next/cache';

// Define the session claims type
type SessionClaims = {
  metadata?: {
    role?: string;
  };
};

const getCachedEvents = unstable_cache(
  async (country: string) => {
    const events = await getAllEvents({
      query: '',
      category: '',
      page: 1,
      limit: 1000,
      country: country
    });

    // Ensure all fields are present in the response
    const eventsWithAllFields = {
      ...events,
      data: events.data?.map((event: IEvent) => ({
        ...event,
        location: event.location || '',  // Explicitly include location
      }))
    };

    return eventsWithAllFields;
  },
  ['api-events-list'],
  {
    revalidate: 60, // Reduce cache time to 1 minute
    tags: ['events']
  }
);

const getCachedSuperAdminEvents = unstable_cache(
  async (country: string) => {
    const events = await getAllEventsForSuperAdmin({
      query: '',
      category: '',
      page: 1,
      limit: 1000,
      country: country
    });

    // Ensure all fields are present in the response
    const eventsWithAllFields = {
      ...events,
      data: events.data?.map((event: IEvent) => ({
        ...event,
        location: event.location || '',  // Explicitly include location
      }))
    };

    return eventsWithAllFields;
  },
  ['superadmin-events-list'],
  {
    revalidate: 60, // Reduce cache time to 1 minute
    tags: ['events']
  }
);

const COMMON_COUNTRIES = ['Singapore', 'Malaysia'];
const preloadEvents = () => {
  COMMON_COUNTRIES.forEach(country => {
    void getCachedEvents(country);
  });
};

// Preload events on startup
preloadEvents();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'Singapore';
    const bustCache = searchParams.get('bustCache') === 'true';
    
    // If cache busting is requested, revalidate the cache
    if (bustCache) {
      revalidateTag('events');
    }
    
    const { sessionClaims } = auth() as { sessionClaims: SessionClaims };
    const isSuperAdmin = sessionClaims?.metadata?.role === 'superadmin';
    
    const events = isSuperAdmin 
      ? await getCachedSuperAdminEvents(country)
      : await getCachedEvents(country);
    
    // Use a shorter cache duration in the response headers
    return new NextResponse(JSON.stringify(events), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30', // Reduce to 1 minute with 30s stale
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
