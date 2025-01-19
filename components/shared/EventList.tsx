import { getAllEvents } from '@/lib/actions/event.actions';
import { preloadEvents } from '@/lib/actions/preload';
import Collection from './Collection';
import { IEvent } from '@/lib/database/models/event.model';
import { CustomField } from '@/types';
import { memo } from 'react';
import { unstable_cache } from 'next/cache';

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
  const cacheKey = `events-${country}-${category}-${searchText}-${page}`;
  
  try {
    let events: EventsResponse;
    
    if (!searchText && !category) {
      events = await preloadEvents(country) as EventsResponse;
    } else {
      events = await unstable_cache(
        async () => getAllEvents({
          query: searchText,
          category,
          page,
          limit: 6,
          country
        }),
        [cacheKey],
        { revalidate: 60, tags: ['events'] }
      )() as EventsResponse;
    }

    if (!events || !events.data) {
      events = { data: [], totalPages: 0 };
    }

    return (
      <>
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
      </>
    );
  } catch (error) {
    console.error('Error in EventList:', error);
    return (
      <div className="text-center p-4">
        <p className="text-red-500">加载活动时出错。请稍后再试。/ Error loading events. Please try again later.</p>
      </div>
    );
  }
}

export default memo(EventList); 