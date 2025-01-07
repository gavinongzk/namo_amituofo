import { preloadEvents } from '@/lib/actions/preload';
import { Suspense } from 'react';
import CategoryFilter from '@/components/shared/CategoryFilter';
import Loading from '@/components/shared/Loader';
import { cookies } from 'next/headers';
import { SearchParamProps } from '@/types';
import EventList from '@/components/shared/EventList';

export default async function Home({ searchParams }: SearchParamProps) {
  try {
    const page = Number(searchParams?.page) || 1;
    const searchText = '';
    const category = (searchParams?.category as string) || '';
    
    const cookieStore = cookies();
    const country = cookieStore.get('userCountry')?.value || 'Singapore';

    if (!category) {
      try {
        const preloadedData = await preloadEvents(country);
        if (!preloadedData || typeof preloadedData !== 'object') {
          console.warn('Invalid preloaded data format');
        }
      } catch (error) {
        console.error('Error preloading events:', error);
      }
    }

    return (
      <section className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <h2 className="h2-bold">最新活动 Latest Events</h2>

        <div className="flex w-full flex-col gap-5 md:flex-row">
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
    );
  } catch (error) {
    console.error('Error in Home page:', error);
    return (
      <div className="wrapper my-8 text-center">
        <p className="text-red-500">出错了，请稍后再试。 Something went wrong. Please try again later.</p>
      </div>
    );
  }
}

