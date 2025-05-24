import { Suspense } from 'react';
import { preloadEvents } from '@/lib/actions/preload';
import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { SearchParamProps } from '@/types';
import { currentUser } from '@clerk/nextjs';

// Dynamically import components
const CategoryFilter = dynamic(() => 
  import('@/components/shared/CategoryFilter'),
  { ssr: true }
);

const EventList = dynamic(() => 
  import('@/components/shared/EventList'),
  { ssr: true }
);

// Add progressive loading skeleton
const EventSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-t-lg" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export default async function Home({ searchParams }: SearchParamProps) {
  const cookieStore = cookies();
  const country = cookieStore.get('userCountry')?.value || 'Singapore';
  
  let userId: string | undefined;
  let role: string | undefined;

  try {
    const user = await currentUser();
    userId = user?.publicMetadata?.userId as string;
    role = user?.publicMetadata?.role as string;
  } catch (error) {
    console.error('Authentication error:', error);
    // Continue without user data
  }

  // Start data fetch early
  const eventsPromise = preloadEvents(country);

  return (
    <section className="wrapper my-8 flex flex-col gap-8">
      <h2 className="h2-bold">最新活动 Latest Events</h2>
      
      <Suspense>
        <CategoryFilter />
      </Suspense>

      <Suspense fallback={<EventSkeleton />}>
        <EventList
          page={Number(searchParams.page) || 1}
          searchText={searchParams.query?.toString() || ''}
          category={searchParams.category?.toString() || ''}
          country={country}
          role={role}
          userId={userId}
        />
      </Suspense>
    </section>
  );
}

