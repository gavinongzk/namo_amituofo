import { Suspense } from 'react';
import CheckoutButton from '@/components/shared/CheckoutButton';
import Collection from '@/components/shared/Collection';
import { getEventBySlug, getRelatedEventsByCategory } from '@/lib/actions/event.actions';
import { formatBilingualDateTime } from '@/lib/utils';
import { SearchParamProps } from '@/types';
import Image from 'next/image';
import { convertPhoneNumbersToLinks } from '@/lib/utils';
import Loading from '@/components/shared/Loader';
import { Metadata } from 'next';
import Link from 'next/link';

const EventInfo = async ({ event }: { event: any }) => {
  return (
    <div className="flex w-full flex-col gap-8 p-5 md:p-10">
      {/* Event Details Card */}
      <div className="flex flex-col gap-6 bg-white rounded-2xl p-8 shadow-md border border-gray-100">
        {/* Title and Category Section */}
        <div className="flex flex-col gap-4">
          <h2 className='text-3xl font-bold text-gray-800'>{event.title}</h2>
          <p className="text-base font-semibold rounded-full bg-green-50 px-6 py-2.5 text-green-600 w-fit">
            {event.category.name}
          </p>
          <div className="flex justify-start">
            <CheckoutButton event={event} />
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Date and Time Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-gray-700">日期和时间 Date & Time</h3>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {formatBilingualDateTime(event.startDateTime).combined.dateOnly}
            </p>
            <p className="text-base text-gray-600">
              {formatBilingualDateTime(event.startDateTime).combined.timeOnly} - {formatBilingualDateTime(event.endDateTime).combined.timeOnly}
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Location Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-gray-700">地点 Location</h3>
          <p className="text-base text-gray-600">
            {event.location}
          </p>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Details/Description Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-gray-700">详细信息 Details</h3>
          <div
            className="text-base text-gray-600 leading-relaxed prose max-w-none"
            dangerouslySetInnerHTML={{ __html: convertPhoneNumbersToLinks(event.description || 'No description available.') }}
          />
        </div>
      </div>
    </div>
  );
};

type EventDetailsProps = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ 
  params: { slug }
}: { 
  params: { slug: string } 
}) {
  const event = await getEventBySlug(slug);
  
  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.',
    };
  }
  
  return {
    title: event.title || 'Event Details',
    description: event.description?.slice(0, 160) || 'Event details page',
  };
}

export default async function EventDetails({ params: { slug }, searchParams }: EventDetailsProps) {
  const event = await getEventBySlug(slug);
  
  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">Sorry, the event you're looking for doesn't exist or has been removed.</p>
          <Link href="/events" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  // Get related events
  const relatedEvents = await getRelatedEventsByCategory({
    categoryId: event.category._id.toString(),
    eventId: event._id.toString(),
    limit: 3,
    page: 1
  });

  return (
    <section className="w-full bg-gray-50 min-h-screen py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <div className="flex items-start justify-center p-5 md:p-10 md:sticky md:top-5">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg">
            <Image 
              src={event.imageUrl}
              alt={event.title}
              width={1000}
              height={1000}
              className="w-full h-full object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
        
        <Suspense fallback={<Loading />}>
          <EventInfo event={event} />
        </Suspense>
      </div>
      
      {/* Related Events Section */}
      {relatedEvents && relatedEvents.data.length > 0 && (
        <div className="wrapper my-8">
          <h2 className="h2-bold">相关活动 Related Events</h2>
          <Collection
            data={relatedEvents.data}
            emptyTitle="No events found"
            emptyStateSubtext="Come back later"
            collectionType="All_Events"
            limit={3}
            page={1}
            totalPages={1}
          />
        </div>
      )}
    </section>
  );
} 