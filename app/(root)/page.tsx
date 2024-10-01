import { Suspense } from 'react';
import CategoryFilter from '@/components/shared/CategoryFilter';
import Collection from '@/components/shared/Collection'
import Search from '@/components/shared/Search';
import { getAllEvents } from '@/lib/actions/event.actions';
import { SearchParamProps } from '@/types';
import Loading from '@/components/shared/Loader';

export default async function Home({ searchParams }: SearchParamProps) {
  const page = Number(searchParams?.page) || 1;
  const searchText = (searchParams?.query as string) || '';
  const category = (searchParams?.category as string) || '';

  return (
    <>
      <section id="events" className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <h2 className="h2-bold">最新活动</h2>

        <div className="flex w-full flex-col gap-5 md:flex-row">
          <Search />
          <CategoryFilter />
        </div>

        <Suspense fallback={<Loading />}>
          <EventList 
            page={page}
            searchText={searchText}
            category={category}
          />
        </Suspense>
      </section>
    </>
  )
}

async function EventList({ page, searchText, category }: { page: number, searchText: string, category: string }) {
  const events = await getAllEvents({
    query: searchText,
    category,
    page,
    limit: 6
  });

  const currentDate = new Date();
  const upcomingEvents = events.data.filter(event => new Date(event.endDateTime) >= currentDate);

  return (
    <Collection 
      data={upcomingEvents}
      emptyTitle="No Events Found"
      emptyStateSubtext="Come back later"
      collectionType="All_Events"
      limit={6}
      page={page}
      totalPages={events.totalPages}
    />
  );
}
