"use client"

import { IEvent } from '@/lib/database/models/event.model'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '../ui/button'

const CheckoutButton = ({ event }: { event: IEvent }) => {
  const router = useRouter()
  const hasEventFinished = new Date(event.endDateTime) < new Date();

  // Prefetch the registration page on mount
  useEffect(() => {
    router.prefetch(`/events/${event._id}/register`)
  }, [event._id, router])

  const handleRegisterClick = () => {
    router.push(`/events/${event._id}/register`);
  }

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">Sorry, registration is closed.</p>
      ) : (
        <Button onClick={handleRegisterClick} className="button rounded-full" size="lg">
          Register 报名
        </Button>
      )}
    </div>
  )
}

export default CheckoutButton