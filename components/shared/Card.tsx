import { IEvent } from '@/lib/database/models/event.model'
import { formatDateTime } from '@/lib/utils'
import { auth } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { CustomField } from '@/types';


type CardProps = {
  event: IEvent & { orderId?: string, customFieldValues?: CustomField[], queueNumber?: string, attendeeCount?: number }, // Add customFieldValues, queueNumber, and attendeeCount to the event type
  hasOrderLink?: boolean,
  isMyTicket?: boolean, // Add this prop
}

const Card = ({ event, hasOrderLink, isMyTicket }: CardProps) => {
  const { sessionClaims } = auth();
  const userId = sessionClaims?.dbUserId as string;

  const isEventCreator = userId === event.organizer._id.toString();

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link 
        href={isMyTicket ? `/orders/${event.orderId}` : `/events/${event._id}`} // Conditional redirect
        style={{backgroundImage: `url(${event.imageUrl})`}}
        className="flex-center flex-grow bg-gray-50 bg-cover bg-center text-grey-500"
      />
      {/* IS EVENT CREATOR ... */}

      {isEventCreator && (
        <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
          <Link href={`/events/${event._id}/update`}>
            <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
          </Link>

          <DeleteConfirmation eventId={event._id} />
        </div>
      )}

      <div className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4"> 
        <p className="p-medium-16 p-medium-18 text-grey-500">
          {formatDateTime(event.startDateTime).dateTime}
        </p>

        <Link href={`/events/${event._id}`}>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 flex-1 text-black">{event.title}</p>
        </Link>

        {isMyTicket && (
          <div className="flex flex-col gap-2">
            <p className="p-medium-16 text-grey-500">Queue Number: {event.queueNumber}</p>
            {event.customFieldValues?.map((field) => (
              <p key={field.id} className="p-medium-16 text-grey-500">{field.label}: {field.value}</p>
            ))}
          </div>
        )}

        {isEventCreator && (
          <div className="flex flex-col gap-2">
            <p className="p-medium-16 text-grey-500">Attendees: {event.attendeeCount}</p>
            <Link href={`/orders?eventId=${event._id}`} className="text-primary-500 underline">Order Details</Link>
          </div>
        )}

        <div className="flex-between w-full">
          {hasOrderLink && (
            <Link href={`/orders?eventId=${event._id}`} className="flex gap-2">
              <Image src="/assets/icons/arrow.svg" alt="search" width={10} height={10} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Card