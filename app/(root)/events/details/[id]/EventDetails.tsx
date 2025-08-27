'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import CheckoutButton from '@/components/shared/CheckoutButton';
import Collection from '@/components/shared/Collection';
import { formatBilingualDateTime } from '@/lib/utils';
import Image from 'next/image';
import { convertPhoneNumbersToLinks } from '@/lib/utils';
import Loading from '@/components/shared/Loader';
import Link from 'next/link';

import { getCategoryColor } from '@/lib/utils/colorUtils';

const EventInfo = ({ event }: { event: any }) => {
  // Get category color
  const categoryColor = event.category.color 
    ? event.category.color 
    : getCategoryColor(event.category.name);
    
  // Safely extract background and text colors
  const colorParts = categoryColor.split(' ');
  const bgColor = colorParts[0] || 'bg-gray-200';
  const textColor = colorParts[1] || 'text-gray-700';

  return (
    <div className="flex w-full flex-col gap-8 p-5 md:p-10">
      {/* Event Details Card */}
      <div className="flex flex-col gap-6 bg-white rounded-2xl p-8 shadow-md border border-gray-100">
        {event.isDraft && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-yellow-800">
            This event is a draft. It is not visible to the public and registration is disabled.
          </div>
        )}
        {/* Title and Category Section */}
        <div className="flex flex-col gap-4">
          <h2 className='text-3xl font-bold text-gray-800'>{event.title}</h2>
          <p className={`text-base font-semibold rounded-full px-6 py-2.5 w-fit ${bgColor} ${textColor}`}>
            {event.category.name}
          </p>
          {!event.isDraft && (
            <div className="flex justify-start">
              <CheckoutButton event={event} />
            </div>
          )}
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
                {formatBilingualDateTime(event.startDateTime).combined.dateOnly}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-gray-800">时间 Time:</p>
              <p className="text-base text-gray-600">
                {formatBilingualDateTime(event.startDateTime).cn.timeOnly} - {formatBilingualDateTime(event.endDateTime).cn.timeOnly}
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Location Section */}
        <div className="flex items-start gap-5">
          <Link 
            href="https://goo.gl/maps/9LsNw8fSLmqRD64X6"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-50 p-4 rounded-full shrink-0 hover:bg-primary-100 transition-colors"
          >
            <Image src="/assets/icons/location.svg" alt="location" width={24} height={24} />
          </Link>
          <Link 
            href="https://goo.gl/maps/9LsNw8fSLmqRD64X6"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1 hover:text-primary-500 transition-colors"
          >
            <p className="text-lg font-semibold text-gray-800">地点 Location:</p>
            <p className="text-base text-gray-600">{event.location}</p>
          </Link>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Description Section */}
        <div className="flex flex-col gap-4">
          <p className="text-xl font-bold text-gray-800">活动描述 Event Description:</p>
          <p 
            className="text-base text-gray-600 leading-relaxed" 
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ 
              __html: convertPhoneNumbersToLinks(event.description) 
            }}
          />
        </div>
      </div>
    </div>
  );
};

const EventImage = ({ event }: { event: any }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const imageUrlRef = useRef(event.imageUrl);

  // Reset image state only when imageUrl actually changes
  useEffect(() => {
    if (imageUrlRef.current !== event.imageUrl) {
      imageUrlRef.current = event.imageUrl;
      setImageError(false);
      setImageLoading(true);
    }
  }, [event.imageUrl]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error(`Failed to load image: ${event.imageUrl}`);
    setImageLoading(false);
    setImageError(true);
  };

  const handleRetryImage = () => {
    setImageError(false);
    setImageLoading(true);
  };

  return (
    <div className="flex items-start justify-center p-5 md:p-10 md:sticky md:top-5">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg bg-gray-50">
        {event.imageUrl && !imageError ? (
          <>
            <Image 
              src={event.imageUrl}
              alt={event.title}
              width={1000}
              height={1000}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoadingComplete={handleImageLoad}
              onError={handleImageError}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
            />
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
          </>
        ) : (
          <div className="flex-center flex-col p-4 text-grey-500 bg-gray-50 w-full h-full rounded-[10px] border-2 border-dashed border-gray-200">
            <div className="flex-center flex-col gap-2 max-w-[200px] text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex-center">
                <div className="w-8 h-8 border-2 border-gray-300 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full -translate-y-1" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-3 bg-gray-300" />
                </div>
              </div>
              <p className="p-medium-14 text-gray-600">
                {imageError ? (
                  <span className="text-red-500">Failed to load image</span>
                ) : (
                  "No image available"
                )}
              </p>
              {imageError && (
                <button 
                  onClick={handleRetryImage}
                  className="mt-1 text-sm text-primary-500 hover:text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm px-2 py-1"
                >
                  Retry loading
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function EventDetails({ event }: { event: any }) {
  if (!event) {
    return (
      <div className="flex-center min-h-[200px]">
        <p className="text-gray-500">Event not found</p>
      </div>
    );
  }

  return (
    <section className="w-full bg-gray-50 min-h-screen py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <Suspense fallback={<Loading />}>
          <EventImage event={event} />
        </Suspense>
        
        <Suspense fallback={<Loading />}>
          <EventInfo event={event} />
        </Suspense>
      </div>
    </section>
  );
} 