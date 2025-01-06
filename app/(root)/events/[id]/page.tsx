import { Suspense } from 'react';
import CheckoutButton from '@/components/shared/CheckoutButton';
import Collection from '@/components/shared/Collection';
import { getEventById, getRelatedEventsByCategory } from '@/lib/actions/event.actions';
import { formatBilingualDateTime } from '@/lib/utils';
import { SearchParamProps } from '@/types';
import Image from 'next/image';
import { convertPhoneNumbersToLinks } from '@/lib/utils';
import Loading from '@/components/shared/Loader';

// Separate component for event details to enable streaming
const EventInfo = async ({ event }: { event: any }) => {
  return (
    <div className="flex w-full flex-col gap-8 p-5 md:p-10">
      <div className="flex flex-col gap-6">
        <h2 className='h2-bold'>{event.title}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <p className="p-medium-16 rounded-full bg-green-500/10 px-4 py-2.5 text-green-700">
              {event.category.name}
            </p>
          </div>
        </div>
      </div>

      <CheckoutButton event={event} />

      <div className="flex flex-col gap-5">
        <div className='flex gap-2 md:gap-3'>
          <Image src="/assets/icons/calendar.svg" alt="calendar" width={32} height={32} />
          <div className="p-medium-16 lg:p-regular-20 flex flex-col gap-2">
            <p>
              日期 Date: {formatBilingualDateTime(event.startDateTime).combined.dateOnly}
            </p>
            <p>
              时间 Time: {formatBilingualDateTime(event.startDateTime).combined.timeOnly} 至 to {' '}
              {formatBilingualDateTime(event.endDateTime).combined.timeOnly}
            </p>
          </div>
        </div>

        <div className="p-regular-20 flex items-center gap-3">
          <Image src="/assets/icons/location.svg" alt="location" width={32} height={32} />
          <p className="p-medium-16 lg:p-regular-20">地点 Location: {event.location}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="p-bold-20 text-grey-600">活动描述 Event Description:</p>
        <p 
          className="p-medium-16 lg:p-regular-18" 
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ 
            __html: convertPhoneNumbersToLinks(event.description) 
          }}
        />
        <p className="p-medium-16 lg:p-regular-18 truncate text-primary-500 underline">
          网址 URL: {event.url}
        </p>
      </div>
    </div>
  );
};

// Add metadata export for caching
export const revalidate = 3600; // Cache for 1 hour

// Main component with preloading and streaming
export default async function EventDetails({ params: { id }, searchParams }: SearchParamProps) {
  // Parallel data fetching with caching
  const eventPromise = getEventById(id);
  const event = await eventPromise;

  // Add metadata for better SEO
  const metadata = {
    title: event.title,
    description: event.description.slice(0, 160), // First 160 characters for SEO
    openGraph: {
      images: [event.imageUrl],
    },
  };

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-7xl mx-auto">
        <div className="flex items-start justify-center p-5 md:p-10 md:sticky md:top-0">
          <Image 
            src={event.imageUrl}
            alt={event.title}
            width={500}
            height={500}
            className="rounded-2xl object-contain w-full h-auto"
            priority // Prioritize image loading
          />
        </div>
        
        <Suspense fallback={<Loading />}>
          <EventInfo event={event} />
        </Suspense>
      </div>
    </section>
  );
}
