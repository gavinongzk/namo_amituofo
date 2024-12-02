import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/actions/event.actions';
import { unstable_cache } from 'next/cache';
import { isAfter, parseISO } from 'date-fns';
import { getEventCounts } from '@/lib/actions/event.actions';

const getCachedEventsWithCounts = unstable_cache(
  async (country: string, startDate: string | null) => {
    const events = await getAllEvents({
      query: '',
      category: '',
      page: 1,
      limit: 1000,
      country: country
    });

    if (!events.data) return events;

    // Filter events by date if startDate is provided
    const filteredEvents = startDate 
      ? events.data.filter(event => isAfter(parseISO(event.endDateTime), parseISO(startDate)))
      : events.data;

    // Get counts for all filtered events in parallel
    const eventsWithCounts = await Promise.all(
      filteredEvents.map(async (event) => {
        const counts = await getEventCounts(event._id);
        return {
          ...event,
          totalRegistrations: counts.totalRegistrations,
          attendedUsers: counts.attendedUsers,
          cannotReciteAndWalk: counts.cannotReciteAndWalk
        };
      })
    );

    return { ...events, data: eventsWithCounts };
  },
  ['api-events-list'],
  {
    revalidate: 300,
    tags: ['events']
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';
    const startDate = searchParams.get('startDate');

    const events = await getCachedEventsWithCounts(country, startDate);
    
    return NextResponse.json(events, {
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
