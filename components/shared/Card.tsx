import { IEvent } from '@/lib/database/models/event.model'
import { formatDateTime } from '@/lib/utils'
import { auth } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { CustomField } from '@/types'
import { motion } from 'framer-motion'

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Link 
          href={isMyTicket ? `/orders/${event.orderId}` : `/events/${event._id}`}
          className="flex-center aspect-square w-full bg-gray-50 bg-cover bg-center text-grey-500"
          style={{backgroundImage: `url(${event.imageUrl})`}}
        />
      </motion.div>

      {isEventCreator && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all"
        >
          <Link href={`/events/${event._id}/update`}>
            <Image src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
          </Link>

          <DeleteConfirmation eventId={event._id} />
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4"
      > 
        <p className="p-medium-16 p-medium-18 text-grey-500">
          {formatDateTime(event.startDateTime).dateTime}
        </p>

        <Link href={`/events/${event._id}`}>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 flex-1 text-black">{event.title}</p>
        </Link>

        {isMyTicket && (
          <div className="flex flex-col gap-2">
            <p className="p-medium-16 text-grey-500">Queue Number: {event.queueNumber || 'N/A'}</p>
            {event.customFieldValues?.map((field) => (
              <p key={field.id} className="p-medium-16 text-grey-500">{field.label}: {field.value}</p>
            ))}
          </div>
        )}

        {isEventCreator && (
          <div className="flex flex-col gap-2">
            <p className="p-medium-16 text-grey-500">Registrations: {event.registrationCount || 0}</p>
            <Link href={`/orders?eventId=${event._id}`} className="text-primary-500 underline flex items-center gap-2">
              Registration Details
              <Image src="/assets/icons/arrow.svg" alt="arrow" width={10} height={10} />
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default Card