'use client'

import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import { auth } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { CustomField } from '@/types'
import { cn } from '@/lib/utils'
import { getCategoryColor } from '@/lib/utils/colorUtils'

// Legacy category colors for backward compatibility
export const categoryColors: { [key: string]: string } = {
  'All': 'bg-gray-200 text-gray-700',
  '念佛超荐法会': 'bg-blue-200 text-blue-700',
  '念佛共修': 'bg-orange-200 text-orange-700',
  '外出结缘法会': 'bg-green-200 text-green-700',
};

interface CardProps {
  event: IEvent & {
    orderId?: string;
    customFieldValues?: CustomField[];
    queueNumber?: string;
    registrationCount?: number;
  };
  hasOrderLink?: boolean;
  isMyTicket?: boolean;
  userId?: string;
  priority?: boolean;
}

const Card = ({ event, hasOrderLink, isMyTicket, userId, priority = false }: CardProps) => {
  const router = useRouter();
  const isEventCreator = userId === event.organizer._id.toString();
  const [imageLoading, setImageLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageUrlRef = useRef(event.imageUrl);
  
  // Debug logging for imageUrl
  console.log('🎨 Card rendering for event:', {
    id: event._id,
    title: event.title,
    imageUrl: event.imageUrl,
    hasImageUrl: !!event.imageUrl,
    imageUrlType: typeof event.imageUrl,
    imageUrlLength: event.imageUrl?.length
  });
  
  // Use dynamic color assignment with fallback to legacy colors
  const categoryColor = event.category.color 
    ? event.category.color 
    : categoryColors[event.category.name] || getCategoryColor(event.category.name);
    
  // Safely extract background and text colors
  const colorParts = categoryColor.split(' ');
  const bgColor = colorParts[0] || 'bg-gray-200';
  const textColor = colorParts[1] || 'text-gray-700';
    
  const isExpired = new Date(event.endDateTime) < new Date();

  // Reset image state only when imageUrl actually changes
  useEffect(() => {
    if (imageUrlRef.current !== event.imageUrl) {
      console.log('🔄 Image URL changed:', event.imageUrl);
      imageUrlRef.current = event.imageUrl;
      setImageError(false);
      setImageLoading(true);
    }
  }, [event.imageUrl]);

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    const href = isMyTicket ? `/reg/${event.orderId}` : `/events/details/${event._id}`;
    router.push(href);
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', event.imageUrl);
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (e: any) => {
    console.error(`❌ Failed to load image: ${event.imageUrl}`, e);
    setImageLoading(false);
    setImageError(true);
  };

  const handleRetryImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageError(false);
    setImageLoading(true);
  };

  return (
    <div 
      className={cn(
        "group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 ease-in-out hover:shadow-card-hover focus-within:ring-2 focus-within:ring-primary-500 md:min-h-[438px]",
        isNavigating && "pointer-events-none opacity-70",
        isExpired && "opacity-75"
      )}
      role="article"
      aria-labelledby={`event-title-${event._id}`}
    >
      <Link
        href={isMyTicket ? `/reg/${event.orderId}` : `/events/details/${event._id}`}
        className="relative flex-center aspect-square w-full bg-gray-50 overflow-hidden rounded-[10px]"
        onClick={handleCardClick}
      >
        {event.imageUrl && event.imageUrl.trim() !== '' && !imageError ? (
          <Image 
            src={event.imageUrl} 
            alt={event.title}
            fill
            className={cn(
              "object-cover transition-opacity duration-300",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoadingComplete={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            quality={priority ? 90 : 75}
          />
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
                ) : !event.imageUrl || event.imageUrl.trim() === '' ? (
                  "No image available"
                ) : (
                  "Loading image..."
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
        {imageLoading && event.imageUrl && event.imageUrl.trim() !== '' && !imageError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
      </Link>

      {isEventCreator && (
        <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white/90 backdrop-blur-sm p-3 shadow-sm transition-all">
          <Link
            href={`/events/details/${event._id}/update`}
            className="transition-transform hover:scale-110 focus:scale-110 focus:outline-none"
            aria-label="Edit event"
          >
            <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
          </Link>

          <DeleteConfirmation eventId={event._id} />
        </div>
      )}

      <div className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span 
              className={`w-3 h-3 rounded-full ${bgColor}`} 
              role="presentation" 
            />
            <p className={`text-sm font-medium ${textColor}`}>
              {event.category.name}
            </p>
          </div>
          {isExpired && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              已过期 / Expired
            </span>
          )}
        </div>
        
        <time 
          dateTime={new Date(event.startDateTime).toISOString()}
          className="text-sm font-medium text-gray-600"
        >
          {formatBilingualDateTime(event.startDateTime).combined.dateOnly} | {formatBilingualDateTime(event.startDateTime).cn.timeOnly} - {formatBilingualDateTime(event.endDateTime).cn.timeOnly}
        </time>

        <Link
          href={`/events/details/${event._id}`}
          className="group/title focus:outline-none"
          onClick={handleCardClick}
        >
          <h2 
            id={`event-title-${event._id}`}
            className="p-medium-16 md:p-medium-20 line-clamp-2 flex-1 text-black transition-colors group-hover/title:text-primary-600 group-focus/title:text-primary-600"
          >
            {event.title}
          </h2>
        </Link>

        {isMyTicket && (
          <div className="flex flex-col gap-2">
            <p className="p-medium-16 text-grey-700">
              <span className="font-semibold">排队号码 Queue Number:</span> {event.queueNumber || 'N/A'}
            </p>
            {event.customFieldValues?.map((field) => (
              <p key={field.id} className="p-medium-16 text-grey-700">
                <span className="font-semibold">{field.label}:</span> {field.value}
              </p>
            ))}
          </div>
        )}

        {isEventCreator && (
          <div className="flex flex-col gap-2 mt-auto pt-3">
            <p className="p-medium-16 text-grey-700">
              <span className="font-semibold">报名人数 Registrations:</span> {event.registrationCount || 0}
            </p>
            <Link 
              href={`/reg?eventId=${event._id}`} 
              className="text-primary-600 hover:text-primary-700 underline flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-sm"
            >
              报名详情 Registration Details
              <Image 
                src="/assets/icons/arrow.svg" 
                alt="" 
                width={10} 
                height={10} 
                aria-hidden="true"
              />
            </Link>
          </div>
        )}
      </div>

      {isNavigating && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default Card