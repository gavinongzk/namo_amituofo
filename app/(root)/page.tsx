import { Suspense } from 'react';
import Error from 'next/error';
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

// Implement ISR (Incremental Static Regeneration)
export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home({ searchParams }: SearchParamProps) {
  const cookieStore = cookies();
  const user = await currentUser();
  
  // Get country from cookies or default to Singapore
  const country = cookieStore.get('country')?.value || 'Singapore';
  
  // Get search parameters
  const query = searchParams?.query as string || '';
  const category = searchParams?.category as string || '';
  const page = Number(searchParams?.page) || 1;

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-contain py-5 md:py-10">
        <div className="wrapper grid grid-cols-1 gap-5 md:grid-cols-2 2xl:gap-0">
          <div className="flex flex-col justify-center gap-8">
            <h1 className="h1-bold">
              {country === 'Singapore' ? '净土宗报名系统' : 'Namo Amituofo Registration'}
            </h1>
            <p className="p-regular-20 md:p-regular-24">
              {country === 'Singapore' 
                ? '欢迎参加我们的活动，在这里您可以轻松注册和查看活动信息。' 
                : 'Join our events and activities with easy registration and event information.'
              }
            </p>
          </div>

          <div className="flex justify-center">
            <img 
              src="/assets/images/hero.png" 
              alt="hero" 
              width={1000} 
              height={1000} 
              className="max-h-[70vh] object-contain object-center 2xl:max-h-[50vh]"
            />
          </div>
        </div>
      </section>

      <section id="events" className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <h2 className="h2-bold">
          {country === 'Singapore' ? '活动列表' : 'Events'}
        </h2>

        <Suspense fallback={<EventSkeleton />}>
          <CategoryFilter country={country} />
        </Suspense>

        <Suspense fallback={<EventSkeleton />}>
          <EventList 
            query={query}
            category={category}
            page={page}
            country={country}
            user={user}
          />
        </Suspense>
      </section>
    </>
  );
}

