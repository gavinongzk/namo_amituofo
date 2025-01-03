import { IEvent } from '@/lib/database/models/event.model'
import { formatDateTime } from '@/lib/utils'
import { auth } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { CustomField } from '@/types';

type CardProps = {
  event: IEvent & { 
    orderId?: string, 
    customFieldValues?: CustomField[], 
    queueNumber?: string, 
    registrationCount?: number  // Changed from attendeeCount to registrationCount
  },
  hasOrderLink?: boolean,
  isMyTicket?: boolean,
}

const Card = ({ event, hasOrderLink, isMyTicket }: CardProps) => {
  const { sessionClaims } = auth();
  const userId = sessionClaims?.dbUserId as string;

  const isEventCreator = userId === event.organizer._id.toString();

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px] md:min-h-[438px]">
      <Link 
        href={isMyTicket ? `/orders/${event.orderId}` : `/events/${event._id}`}
        className="flex-center relative aspect-square w-full bg-grey-50 bg-cover bg-center text-grey-500 overflow-hidden"
        style={{backgroundImage: `url(${event.imageUrl})`}}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {isEventCreator && (
        <div className="absolute right-3 top-3 flex flex-col gap-4 rounded-xl bg-white/95 backdrop-blur-sm p-3 shadow-lg transition-all duration-300 hover:shadow-xl">
          <Link href={`/events/${event._id}/update`} className="transition-transform hover:scale-110 duration-300">
            <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
          </Link>

          <DeleteConfirmation eventId={event._id} />
        </div>
      )}

      <div className="flex min-h-[230px] flex-col gap-4 p-6 md:gap-5"> 
        <div className="space-y-3">
          <p className="text-sm md:text-base text-grey-500 font-medium">
            {formatDateTime(event.startDateTime).dateTime}
          </p>

          <Link href={`/events/${event._id}`} className="group/title">
            <h3 className="text-lg md:text-xl font-semibold line-clamp-2 text-gray-900 group-hover/title:text-primary transition-colors duration-300">
              {event.title}
            </h3>
          </Link>
        </div>

        {isMyTicket && (
          <div className="flex flex-col gap-2.5 pt-2">
            <p className="text-base text-grey-600">Queue Number: <span className="font-medium">{event.queueNumber || 'N/A'}</span></p>
            {event.customFieldValues?.map((field) => (
              <p key={field.id} className="text-base text-grey-600">{field.label}: <span className="font-medium">{field.value}</span></p>
            ))}
          </div>
        )}

        {isEventCreator && (
          <div className="flex flex-col gap-2.5 pt-2">
            <p className="text-base text-grey-600">Registrations: <span className="font-medium">{event.registrationCount || 0}</span></p>
            <Link 
              href={`/orders?eventId=${event._id}`} 
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors duration-300"
            >
              <span className="underline-offset-4 hover:underline">Registration Details</span>
              <Image src="/assets/icons/arrow.svg" alt="arrow" width={10} height={10} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Card