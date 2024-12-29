import { getAllEvents } from '@/lib/actions/event.actions';
import { preloadEvents } from '@/lib/actions/preload';
import Collection from './Collection';
import { IEvent } from '@/lib/database/models/event.model';
import { CustomField } from '@/types';

interface EventListProps {
  page: number;
  searchText: string;
  category: string;
  country: string;
}

interface EventsResponse {
  data: IEvent[];
  totalPages: number;
}

async function EventList({ page, searchText, category, country }: EventListProps) {
  console.log('🎬 EventList starting with params:', { page, searchText, category, country });
  
  let events: EventsResponse;
  let error: string | null = null;
  
  try {
    if (!searchText && !category) {
      console.log('📥 Using preloadEvents cache');
      events = await preloadEvents(country) as EventsResponse;
      console.log('📦 Preloaded events:', JSON.stringify(events, null, 2));
    } else {
      console.log('🔍 Fetching events directly');
      events = await getAllEvents({
        query: searchText,
        category,
        page,
        limit: 6,
        country: country || 'Singapore'
      }) as EventsResponse;
      console.log('📦 Fetched events:', JSON.stringify(events, null, 2));
    }

    if (!events || !events.data) {
      console.warn('⚠️ No events data available');
      events = { data: [], totalPages: 0 };
      error = 'No events available for your region at this time.';
    }

    console.log('✅ Rendering Collection with events:', {
      dataLength: events.data?.length,
      totalPages: events.totalPages
    });

    return (
      <>
        {error && (
          <div className="w-full text-center mb-6">
            <p className="text-amber-600">{error}</p>
            <p className="text-gray-600 text-sm mt-2">
              Try changing your country selection or check back later for new events.
            </p>
          </div>
        )}
        <Collection
          data={events.data}
          emptyTitle={error || "No Events Found"}
          emptyStateSubtext={
            error 
              ? "Please try selecting a different country or check back later."
              : "Come back later for more events."
          }
          collectionType="All_Events"
          limit={6}
          page={page}
          totalPages={events.totalPages}
          urlParamName="page"
        />
      </>
    );
  } catch (error) {
    console.error('❌ Error in EventList:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return (
      <div className="w-full">
        <Collection
          data={[]}
          emptyTitle="Unable to Load Events"
          emptyStateSubtext="We're having trouble loading events. This might be due to connection issues or temporary service disruption. Please try again later."
          collectionType="All_Events"
          limit={6}
          page={page}
          totalPages={0}
          urlParamName="page"
        />
      </div>
    );
  }
}

export default EventList; 