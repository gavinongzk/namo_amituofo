import { preloadEvents } from '@/lib/actions/preload';
import { Suspense } from 'react';
import CategoryFilter from '@/components/shared/CategoryFilter';
import Search from '@/components/shared/Search';
import Loading from '@/components/shared/Loader';
import { cookies } from 'next/headers';
import { SearchParamProps } from '@/types';
import EventList from '@/components/shared/EventList';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';

export default async function Home({ searchParams }: SearchParamProps) {
  try {
    const page = Number(searchParams?.page) || 1;
    const searchText = (searchParams?.query as string) || '';
    const category = (searchParams?.category as string) || '';
    
    const cookieStore = cookies();
    const country = cookieStore.get('userCountry')?.value || 'Singapore';

    if (!searchText && !category) {
      try {
        const preloadedData = await preloadEvents(country);
        if (!preloadedData || typeof preloadedData !== 'object') {
          console.warn('Invalid preloaded data format');
        }
      } catch (error) {
        console.error('Error preloading events:', error);
        // Continue execution - preloading failure shouldn't block the page
      }
    }

    return (
      <section className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <h2 className="h2-bold">Latest Events 最新活动</h2>

        <div className="flex w-full flex-col gap-5 md:flex-row">
          <Search />
          <CategoryFilter />
        </div>

        <Suspense fallback={<Loading />}>
          <ErrorBoundary fallback={
            <div className="text-center py-10">
              <p className="text-red-500 mb-4">Unable to load events at this time.</p>
              <p className="text-gray-600">Please try refreshing the page or check back later.</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Refresh Page
              </Button>
            </div>
          }>
            <EventList 
              page={page}
              searchText={searchText}
              category={category}
              country={country}
            />
          </ErrorBoundary>
        </Suspense>
      </section>
    );
  } catch (error) {
    console.error('Error in Home page:', error);
    return (
      <div className="wrapper my-8 flex flex-col items-center justify-center text-center">
        <p className="text-red-500 mb-4">We're having trouble loading the events.</p>
        <p className="text-gray-600 mb-6">This might be due to connection issues or temporary service disruption.</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="button"
        >
          Try Again
        </Button>
      </div>
    );
  }
}

