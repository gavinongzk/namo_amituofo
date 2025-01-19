import { getAllEvents } from '@/lib/actions/event.actions';
import { preloadEvents } from '@/lib/actions/preload';
import Collection from './Collection';
import { IEvent } from '@/lib/database/models/event.model';
import { CustomField } from '@/types';
import { memo } from 'react';

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
        country
      }) as EventsResponse;
      console.log('📦 Fetched events:', JSON.stringify(events, null, 2));
    }

    if (!events || !events.data) {
      console.warn('⚠️ No events data available');
      events = { data: [], totalPages: 0 };
    }

    console.log('✅ Rendering Collection with events:', {
      dataLength: events.data?.length,
      totalPages: events.totalPages
    });

    return (
      <Collection
        data={events.data as (IEvent & { 
          orderId?: string;
          customFieldValues?: CustomField[];
          queueNumber?: string;
          registrationCount?: number;
        })[]}
        emptyTitle="未找到活动 / No Events Found"
        emptyStateSubtext="请稍后再来查看更多活动。/ Come back later for more events."
        collectionType="All_Events"
        limit={6}
        page={page}
        totalPages={events.totalPages}
        urlParamName="page"
      />
    );
  } catch (error) {
    console.error('❌ Error in EventList:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return empty collection on error
    return (
      <Collection
        data={[]}
        emptyTitle="加载出错 / Error Loading Events"
        emptyStateSubtext="请稍后再试。/ Please try again later."
        collectionType="All_Events"
        limit={6}
        page={page}
        totalPages={0}
        urlParamName="page"
      />
    );
  }
}

export default memo(EventList); 