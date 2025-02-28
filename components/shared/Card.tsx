import { IEvent } from '@/lib/database/models/event.model'
import { formatBilingualDateTime } from '@/lib/utils'
import { auth } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { CustomField } from '@/types';

// Shared category colors - matching with actual categories
export const categoryColors: { [key: string]: string } = {
  'All': 'bg-gray-200',
  '念佛共修': 'bg-orange-200',
  '念佛｜闻法｜祈福｜超荐': 'bg-blue-200',
  '外出结缘法会': 'bg-green-200',
};

type CardProps = {
  event: IEvent & { 
    orderId?: string, 
    customFieldValues?: CustomField[], 
    queueNumber?: string, 
    registrationCount?: number
  },
  hasOrderLink?: boolean,
  isMyTicket?: boolean,
}

const Card = ({ event, hasOrderLink, isMyTicket }: CardProps) => {
  const { sessionClaims } = auth();
  const userId = sessionClaims?.dbUserId as string;
  const isEventCreator = userId === event.organizer._id.toString();
  const categoryColor = categoryColors[event.category.name] || 'bg-gray-200';

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link 
        href={isMyTicket ? `/orders/${event.orderId}` : `/events/${event._id}`}
        className="flex-center aspect-square w-full bg-gray-50 bg-cover bg-center text-grey-500"
        style={{backgroundImage: `url(${event.imageUrl})`}}
      />

      {isEventCreator && (
        <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
          <Link href={`/events/${event._id}/update`}>
            <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
          </Link>

          <DeleteConfirmation eventId={event._id} />
        </div>
      )}

      <div className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${categoryColor}`} />
          <p className="text-sm text-gray-600">{event.category.name}</p>
        </div>
        
        {formatBilingualDateTime(event.startDateTime).combined.dateTime.split('\n').map((line, index) => (
          <p key={index} className={`${index === 0 ? 'text-gray-600' : 'text-gray-500'} ${index === 0 ? 'text-base' : 'text-sm'}`}>
            {line}
          </p>
        ))}

        <Link href={`/events/${event._id}`}>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 flex-1 text-black">{event.title}</p>
        </Link>

        {isMyTicket && (
          <div className="flex flex-col gap-2">
            <p className="p-medium-16 text-grey-500">排队号码 Queue Number: {event.queueNumber || 'N/A'}</p>
            {event.customFieldValues?.map((field) => (
              <p key={field.id} className="p-medium-16 text-grey-500">{field.label}: {field.value}</p>
            ))}
          </div>
        )}

        {isEventCreator && (
          <div className="flex flex-col gap-2">
            <p className="p-medium-16 text-grey-500">注册人数 Registrations: {event.registrationCount || 0}</p>
            <Link href={`/orders?eventId=${event._id}`} className="text-primary-500 underline flex items-center gap-2">
              注册详情 Registration Details
              <Image src="/assets/icons/arrow.svg" alt="arrow" width={10} height={10} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Card