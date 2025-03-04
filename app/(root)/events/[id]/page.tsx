import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CheckoutButton from '@/components/shared/CheckoutButton';
import { getEventByDate, getEventById } from '@/lib/actions/event.actions';
import { formatBilingualDateTime } from '@/lib/utils';
import Image from 'next/image';
import { convertPhoneNumbersToLinks } from '@/lib/utils';
import Loading from '@/components/shared/Loader';
import { Metadata } from 'next';

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
        <div className='flex gap-5 items-start'>
          <div className="bg-primary-50 p-4 rounded-full shrink-0">
            <Image src="/assets/icons/calendar.svg" alt="calendar" width={24} height={24} />
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-gray-800">日期 Date:</p>
              <p className="text-base text-gray-600">
                {formatBilingualDateTime(event.startDateTime).cn.dateOnly} {formatBilingualDateTime(event.startDateTime).en.dateOnly}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-gray-800">时间 Time:</p>
              <p className="text-base text-gray-600">
                {formatBilingualDateTime(event.startDateTime).cn.timeOnly} - {formatBilingualDateTime(event.endDateTime).cn.timeOnly} {formatBilingualDateTime(event.startDateTime).en.timeOnly} - {formatBilingualDateTime(event.endDateTime).en.timeOnly}
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Location Section */}
        <div className="flex items-start gap-5">
          <div className="bg-primary-50 p-4 rounded-full shrink-0">
            <Image src="/assets/icons/location.svg" alt="location" width={24} height={24} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-gray-800">地点 Location:</p>
            <p className="text-base text-gray-600">{event.location}</p>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Description Section */}
        <div className="flex items-start gap-5">
          <div className="bg-primary-50 p-4 rounded-full shrink-0">
            <Image src="/assets/icons/description.svg" alt="description" width={24} height={24} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-gray-800">活动详情 Description:</p>
            <div 
              className="text-base text-gray-600 prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: convertPhoneNumbersToLinks(event.description || '') 
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

type EventDetailsProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate metadata for social sharing
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Try to get event by ID first, then by date if ID fails
  const event = await getEventById(params.id) || await getEventByDate(params.id);
  
  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.',
    };
  }

  return {
    title: event.title || 'Event Details',
    description: event.description?.slice(0, 160) || 'Event details',
    openGraph: {
      title: event.title || 'Event Details',
      description: event.description?.slice(0, 160) || 'Event details',
      images: [
        {
          url: event.imageUrl || '',
          width: 1200,
          height: 630,
          alt: event.title,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title || 'Event Details',
      description: event.description?.slice(0, 160) || 'Event details',
      images: [event.imageUrl || ''],
    },
    other: {
      'whatsapp-preview': 'true',
    }
  };
}

export default async function EventDetails({ params: { id }, searchParams }: EventDetailsProps) {
  // Try to get event by ID first
  let event = await getEventById(id);

  // If not found by ID, try to get by date
  if (!event) {
    event = await getEventByDate(id);
  }

  // If still not found, return 404
  if (!event) {
    notFound();
  }

  return (
    <section className="w-full bg-gray-50 min-h-screen py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <div className="flex items-start justify-center p-5 md:p-10 md:sticky md:top-5">
          <Image 
            src={event.imageUrl}
            alt={event.title}
            width={500}
            height={500}
            className="rounded-2xl object-contain w-full h-auto shadow-lg"
            priority
          />
        </div>
        
        <Suspense fallback={<Loading />}>
          <EventInfo event={event} />
        </Suspense>
      </div>
    </section>
  );
}
