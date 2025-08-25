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
    try {
      const events = await getAllEvents({
        query: '',
        category: '',
        page: 1,
        limit: 100, // Reduced limit for better performance
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
    } catch (error) {
      console.error('Error in getCachedEvents:', error);
      return { data: [], totalPages: 0 };
    }
  },
  ['api-events-list', 'country'],  // Include country in cache key
  {
    revalidate: 600, // Cache for 10 minutes (increased from 5)
    tags: ['events']
  }
);

const getCachedSuperAdminEvents = unstable_cache(
  async (country: string) => {
    try {
      const events = await getAllEventsForSuperAdmin({
        query: '',
        category: '',
        page: 1,
        limit: 100, // Reduced limit for better performance
        country: country
      });

      if (!events || !events.data) {
        console.error('No events returned from getAllEventsForSuperAdmin');
        return { data: [], totalPages: 0 };
      }

      // Ensure all fields are present in the response
      const eventsWithAllFields = {
        ...events,
        data: events.data.map((event: IEvent) => ({
          ...event,
          location: event.location || '',  // Explicitly include location
        }))
      };

      return eventsWithAllFields;
    } catch (error) {
      console.error('Error in getCachedSuperAdminEvents:', error);
      return { data: [], totalPages: 0 };
    }
  },
  ['superadmin-events-list', 'country'],  // Include country in cache key
  {
    revalidate: 600, // Cache for 10 minutes (increased from 5)
    tags: ['events', 'admin-events']
  }
);

// Remove the preloading mechanism that was causing build timeouts
// Instead, we'll rely on Next.js cache warming and on-demand loading

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'Singapore';
    const bustCache = searchParams.get('bustCache') === 'true';
    const role = searchParams.get('role');
    
    // If cache busting is requested, revalidate the cache
    if (bustCache) {
      revalidateTag('events');
    }
    
    const isSuperAdmin = role === 'superadmin';
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 second timeout
    });
    
    const eventsPromise = isSuperAdmin 
      ? getCachedSuperAdminEvents(country)
      : getCachedEvents(country);
    
    const events = await Promise.race([eventsPromise, timeoutPromise]) as any;
    
    // Improved caching strategy with longer cache times
    return new NextResponse(JSON.stringify(events), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': isSuperAdmin 
          ? 'private, max-age=600, s-maxage=1200, stale-while-revalidate=3600' 
          : 'public, max-age=600, s-maxage=1200, stale-while-revalidate=3600',
        'Surrogate-Control': 'max-age=1200',
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    
    // Return cached data if available, otherwise return error
    try {
      const fallbackEvents = await getCachedEvents('Singapore');
      return new NextResponse(JSON.stringify(fallbackEvents), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
          'X-Error': 'true',
        },
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { message: 'Failed to fetch events', data: [], totalPages: 0 }, 
        { status: 500 }
      );
    }
  }
}
