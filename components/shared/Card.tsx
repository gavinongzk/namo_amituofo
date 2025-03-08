'use client'

import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import { auth } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { CustomField } from '@/types'
import { cn } from '@/lib/utils'

// Shared category colors - matching with actual categories
export const categoryColors: { [key: string]: string } = {
  'All': 'bg-gray-200 text-gray-700',
  '念佛共修': 'bg-orange-200 text-orange-700',
  '念佛｜闻法｜祈福｜超荐': 'bg-blue-200 text-blue-700',
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
  const isEventCreator = userId === event.organizer._id.toString();
  const [imageLoading, setImageLoading] = useState(true);
  const categoryColor = categoryColors[event.category.name] || 'bg-gray-200 text-gray-700';

  return (
    <div 
      className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 ease-in-out hover:shadow-card-hover focus-within:ring-2 focus-within:ring-primary-500 md:min-h-[438px]"
      role="article"
      aria-labelledby={`event-title-${event._id}`}
    >
      <Link 
        href={isMyTicket ? `/orders/${event.orderId}` : `/events/details/${event._id}`}
        className="relative flex-center aspect-square w-full bg-gray-50 overflow-hidden"
      >
        {event.imageUrl ? (
          <Image 
            src={event.imageUrl} 
            alt={event.title}
            fill
            className={cn(
              "object-cover transition-opacity duration-300",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            sizes="(max-width: 400px) 100vw, 400px"
            onLoadingComplete={() => setImageLoading(false)}
            priority={priority}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy82NDg0PUA4Nj9BOTs/QTY/QUhCRk1KSlVWVkBNXl9nYWf/2wBDARUXFx4aHh8fHmhANUA2YGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGf/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        ) : (
          <div className="flex-center flex-col text-grey-500">
            <Image src="/assets/icons/image-placeholder.svg" width={40} height={40} alt="placeholder" />
            <p className="p-medium-14 mt-2">No image available</p>
          </div>
        )}
        {imageLoading && event.imageUrl && (
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
          href={`/events/details/${event._id}`}
          className="group/title focus:outline-none"
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
              href={`/orders?eventId=${event._id}`} 
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
    </div>
  )
}

export default Card