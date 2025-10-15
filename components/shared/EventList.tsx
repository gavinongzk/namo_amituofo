import { getEventsForMainPage } from '@/lib/actions/event.actions';
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
    // Add cache-busting parameter to ensure fresh data
    const cacheBuster = Date.now();
    
    // Force fresh data fetch by adding a timestamp
    events = await getEventsForMainPage({
      query: searchText,
      category,
      page,
      limit: 6,
      country,
      role
    }) as EventsResponse;
    
    console.log('📦 Fetched events:', {
      count: events.data?.length,
      events: events.data?.map(event => ({
        id: event._id,
        title: event.title,
        imageUrl: event.imageUrl,
        hasImageUrl: !!event.imageUrl
      }))
    });

    if (!events || !events.data) {
      console.warn('⚠️ No events data available');
      events = { data: [], totalPages: 0 };
    }

    console.log('✅ Rendering Collection with events:', {
      dataLength: events.data?.length,
      totalPages: events.totalPages
    });

    // Show drafts only for superadmins; hide for others
    const visibleData = (events.data || []).filter((e: any) => {
      if (!e) return false;
      if (role === 'superadmin') return true;
      return e.isDraft !== true;
    });

    return (
      <Collection
        data={visibleData as (IEvent & { 
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