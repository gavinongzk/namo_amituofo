import { Suspense } from 'react';
import CheckoutButton from '@/components/shared/CheckoutButton';
import Collection from '@/components/shared/Collection';
import { getEventById, getRelatedEventsByCategory } from '@/lib/actions/event.actions';
import { formatDateTime } from '@/lib/utils';
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
          <div className="p-medium-16 lg:p-regular-20 flex flex-wrap items-center">
            <p>
              {formatDateTime(event.startDateTime).dateOnly} - {' '}
              {formatDateTime(event.startDateTime).timeOnly}
            </p>
            <p>
              {formatDateTime(event.endDateTime).dateOnly} -  {' '}
              {formatDateTime(event.endDateTime).timeOnly}
            </p>
          </div>
        </div>

        <div className="p-regular-20 flex items-center gap-3">
          <Image src="/assets/icons/location.svg" alt="location" width={32} height={32} />
          <p className="p-medium-16 lg:p-regular-20">{event.location}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="p-bold-20 text-grey-600">Event Description / 活动描述:</p>
        <p 
          className="p-medium-16 lg:p-regular-18" 
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ 
            __html: convertPhoneNumbersToLinks(event.description) 
          }}
        />
        <p className="p-medium-16 lg:p-regular-18 truncate text-primary-500 underline">
          {event.url}
        </p>
      </div>
    </div>
  );
};

// Main component with preloading and streaming
export default async function EventDetails({ params: { id }, searchParams }: SearchParamProps) {
  // Parallel data fetching
  const eventPromise = getEventById(id);
  const event = await eventPromise;

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

// Generate static params for common events
export async function generateStaticParams() {
  // Add your most common event IDs here
  return [
    { id: 'popular-event-1' },
    { id: 'popular-event-2' },
  ];
}