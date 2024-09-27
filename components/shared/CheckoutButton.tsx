"use client"

import { IEvent } from '@/lib/database/models/event.model'
import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'

const CheckoutButton = ({ event }: { event: IEvent }) => {
  const hasEventFinished = new Date(event.endDateTime) < new Date();

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">Sorry, registration is closed.</p>
      ) : (
        <Button asChild className="button rounded-full" size="lg">
          <Link href={`/events/${event._id}/register`}>
            Register
          </Link>
        </Button>
      )}
    </div>
  )
}

export default CheckoutButton