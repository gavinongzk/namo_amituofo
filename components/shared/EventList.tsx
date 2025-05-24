import { getAllEvents } from '@/lib/actions/event.actions';
import { preloadEvents, preloadEventsByCategory } from '@/lib/actions/preload';
import Collection from './Collection';
import { IEvent } from '@/lib/database/models/event.model';
import { CustomField } from '@/types';
import { currentUser } from '@clerk/nextjs';
import ErrorMessage from './ErrorMessage';

interface EventListProps {
  page: number;
  searchText: string;
  category: string;
  country: string;
  role?: string;
  userId?: string;
}

interface EventsResponse {
  data: IEvent[];
  totalPages: number;
}

async function EventList({ page, searchText, category, country, role, userId }: EventListProps) {
  console.log('🎬 EventList starting with params:', { page, searchText, category, country, role, userId });
  
  let events: EventsResponse;
  
  try {
    if (!searchText && !category) {
      console.log('📥 Using preloadEvents cache');
      events = await preloadEvents(country, role) as EventsResponse;
      console.log('📦 Preloaded events:', JSON.stringify(events, null, 2));
    } else if (!searchText && category) {
      console.log('📥 Using preloadEventsByCategory cache');
      events = await preloadEventsByCategory(country, category, role) as EventsResponse;
      console.log('📦 Preloaded category events:', JSON.stringify(events, null, 2));
    } else {
      console.log('🔍 Fetching events directly');
      events = await getAllEvents({
        query: searchText,
        category,
        page,
        limit: 6,
        country,
        role
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
        userId={userId}
      />
    );
  } catch (error) {
    console.error('❌ Error in EventList:', error);
    return (
      <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 py-28">
        <ErrorMessage
          message="Something went wrong"
          messageZh="出错了"
        />
      </div>
    );
  }
}

export default EventList; 