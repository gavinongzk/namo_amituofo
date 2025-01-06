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
      {/* Title and Category Section */}
      <div className="flex flex-col gap-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className='h2-bold text-gray-800'>{event.title}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <p className="p-medium-16 rounded-full bg-green-50 px-5 py-2.5 text-green-600 font-semibold">
              {event.category.name}
            </p>
          </div>
        </div>
      </div>

      <CheckoutButton event={event} />

      {/* Date and Location Section */}
      <div className="flex flex-col gap-5 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className='flex gap-4 items-start'>
          <div className="bg-primary-50 p-3 rounded-full">
            <Image src="/assets/icons/calendar.svg" alt="calendar" width={24} height={24} />
          </div>
          <div className="p-medium-16 lg:p-regular-20 flex flex-col gap-3">
            <div className="flex flex-col">
              <p className="font-semibold text-gray-700">日期 Date:</p>
              <p className="text-gray-600">{formatBilingualDateTime(event.startDateTime).combined.dateOnly}</p>
            </div>
            <div className="flex flex-col">
              <p className="font-semibold text-gray-700">时间 Time:</p>
              <p className="text-gray-600">{formatBilingualDateTime(event.startDateTime).combined.timeOnly} - {formatBilingualDateTime(event.endDateTime).combined.timeOnly}</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-2" />

        <div className="flex items-start gap-4">
          <div className="bg-primary-50 p-3 rounded-full">
            <Image src="/assets/icons/location.svg" alt="location" width={24} height={24} />
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-2">地点 Location:</p>
            <p className="text-gray-600">{event.location}</p>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <p className="p-bold-20 text-gray-800 mb-4">活动描述 Event Description:</p>
        <p 
          className="p-medium-16 lg:p-regular-18 text-gray-600 leading-relaxed" 
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ 
            __html: convertPhoneNumbersToLinks(event.description) 
          }}
        />
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
