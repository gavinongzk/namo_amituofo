import CategoryFilter from '@/components/shared/CategoryFilter';
import Collection from '@/components/shared/Collection'
import Search from '@/components/shared/Search';
import { Button } from '@/components/ui/button'
import { getAllEvents } from '@/lib/actions/event.actions';
import { SearchParamProps } from '@/types';
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@clerk/nextjs';

async function getCountry(userId?: string | null) {
  if (userId) {
    const res = await fetch(`/api/geolocation`, {
      headers: { 'X-User-Id': userId },
    });
    if (res.ok) return (await res.json()).country;
  }
  
  // Fallback to geojs for non-logged in users
  const res = await fetch('https://get.geojs.io/v1/ip/country.json');
  return res.ok ? (await res.json()).country : null;
}

export default async function Home({ searchParams }: SearchParamProps) {
  const { userId } = auth();
  const page = Number(searchParams?.page) || 1;
  const searchText = (searchParams?.query as string) || '';
  const category = (searchParams?.category as string) || '';
  
  const country = await getCountry(userId);

  const events = await getAllEvents({
    query: searchText,
    category,
    page,
    limit: 6,
    country
  })

  return (
    <>
      <section id="events" className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <h2 className="h2-bold">最新活动 {country ? `in ${country}` : ''}</h2>

        <div className="flex w-full flex-col gap-5 md:flex-row">
          <Search />
          <CategoryFilter />
        </div>

        <Collection 
          data={events?.data}
          emptyTitle="No Events Found"
          emptyStateSubtext="Come back later"
          collectionType="All_Events"
          limit={6}
          page={page}
          totalPages={events?.totalPages}
        />
      </section>
    </>
  )
}
