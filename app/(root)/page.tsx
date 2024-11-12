import { Suspense } from 'react';
import CategoryFilter from '@/components/shared/CategoryFilter';
import Collection from '@/components/shared/Collection'
import Search from '@/components/shared/Search';
import { getAllEvents } from '@/lib/actions/event.actions';
import { SearchParamProps } from '@/types';
import Loading from '@/components/shared/Loader';
import { cookies } from 'next/headers';
import { addDays } from 'date-fns';

export default async function Home({ searchParams }: SearchParamProps) {
  const page = Number(searchParams?.page) || 1;
  const searchText = (searchParams?.query as string) || '';
  const category = (searchParams?.category as string) || '';
  
  // Get the country from cookies
  const cookieStore = cookies();
  const country = cookieStore.get('userCountry')?.value || 'Singapore'; // Default to Singapore if not set

  return (
    <>
      <section id="events" className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <h2 className="h2-bold">Latest Events 最新活动</h2>

        <div className="flex w-full flex-col gap-5 md:flex-row">
          <Search />
          <CategoryFilter />
        </div>

        <Suspense fallback={<Loading />}>
          <EventList 
            page={page}
            searchText={searchText}
            category={category}
            country={country}
          />
        </Suspense>
      </section>
    </>
  )
}

async function EventList({ page, searchText, category, country }: { page: number, searchText: string, category: string, country: string }) {
  const events = await getAllEvents({
    query: searchText,
    category,
    page,
    limit: 6,
    country
  });

  const currentDate = new Date();
  const fiveDaysAgo = addDays(currentDate, -5);

  const recentAndUpcomingEvents = events.data.filter(event => 
    new Date(event.endDateTime) >= fiveDaysAgo
  );

  return (
    <Collection 
      data={recentAndUpcomingEvents}
      emptyTitle="No Events Found 未找到活动"
      emptyStateSubtext="Come back later 请稍后再来"
      collectionType="All_Events"
      limit={6}
      page={page}
      totalPages={events.totalPages}
    />
  );
}
