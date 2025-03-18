'use client'

import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import { auth } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { CustomField } from '@/types'
import { cn } from '@/lib/utils'

// Shared category colors - matching with actual categories
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
  const [isOnline, setIsOnline] = useState(true);
  const categoryColor = categoryColors[event.category.name] || 'bg-gray-200 text-gray-700';

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Reset image error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [event.imageUrl]);

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isOnline) {
      e.preventDefault();
      alert('This action requires an internet connection. Please check your connection and try again.');
      return;
    }
    e.preventDefault();
    setIsNavigating(true);
    const href = isMyTicket ? `/reg/${event.orderId}` : `/events/${event.slug}`;
    router.push(href);
  };

  return (
    <div 
      className={cn(
        "group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 ease-in-out hover:shadow-card-hover focus-within:ring-2 focus-within:ring-primary-500 md:min-h-[438px]",
        isNavigating && "pointer-events-none opacity-70"
      )}
      role="article"
      aria-labelledby={`event-title-${event._id}`}
    >
      <Link 
        href={isMyTicket ? `/reg/${event.orderId}` : `/events/${event.slug}`}
        className="relative flex-center aspect-square w-full bg-gray-50 overflow-hidden rounded-[10px]"
        onClick={handleCardClick}
      >
        {event.imageUrl && !imageError ? (
          <Image 
            src={event.imageUrl} 
            alt={event.title}
            fill
            className={cn(
              "object-cover transition-opacity duration-300",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoadingComplete={() => {
              setImageLoading(false);
              setImageError(false);
            }}
            onError={() => {
              console.error(`Failed to load image: ${event.imageUrl}`);
              setImageLoading(false);
              setImageError(true);
              // Attempt to reload the image if it's a network error
              if (!navigator.onLine && event.imageUrl) {
                const img = new window.Image();
                img.src = event.imageUrl;
                img.onload = () => {
                  setImageError(false);
                  setImageLoading(false);
                };
              }
            }}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="flex-center flex-col text-grey-500">
            <Image src="/assets/icons/image-placeholder.svg" width={40} height={40} alt="placeholder" />
            <p className="p-medium-14 mt-2">{imageError ? "Failed to load image" : "No image available"}</p>
            {imageError && isOnline && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setImageError(false);
                  setImageLoading(true);
                }}
                className="mt-2 text-sm text-primary-500 hover:underline"
              >
                Retry loading
              </button>
            )}
          </div>
        )}
        {imageLoading && event.imageUrl && !imageError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
      </Link>

      {isEventCreator && (
        <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white/90 backdrop-blur-sm p-3 shadow-sm transition-all">
          <Link 
            href={`/events/${event.slug}/update`}
            className="transition-transform hover:scale-110 focus:scale-110 focus:outline-none"
            aria-label="Edit event"
          >
            <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
          </Link>

          <DeleteConfirmation eventId={event._id} />
        </div>
      )}

      <div className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4">
        <div className="flex items-center gap-2">
          <span 
            className={`w-3 h-3 rounded-full ${categoryColor.split(' ')[0]}`} 
            role="presentation" 
          />
          <p className={`text-sm font-medium ${categoryColor.split(' ')[1]}`}>
            {event.category.name}
          </p>
        </div>
        
        <time 
          dateTime={new Date(event.startDateTime).toISOString()}
          className="text-sm font-medium text-gray-600"
        >
          {formatBilingualDateTime(event.startDateTime).combined.dateOnly} | {formatBilingualDateTime(event.startDateTime).cn.timeOnly} - {formatBilingualDateTime(event.endDateTime).cn.timeOnly}
        </time>

        <Link 
          href={`/events/${event.slug}`}
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
              <span className="font-semibold">注册人数 Registrations:</span> {event.registrationCount || 0}
            </p>
            <Link 
              href={`/reg?eventId=${event._id}`} 
              className="text-primary-600 hover:text-primary-700 underline flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-sm"
            >
              注册详情 Registration Details
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