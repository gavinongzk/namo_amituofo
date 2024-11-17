"use client"

import { IEvent } from '@/lib/database/models/event.model'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'

const CheckoutButton = ({ event }: { event: IEvent }) => {
  const router = useRouter()
  const hasEventFinished = new Date(event.endDateTime) < new Date()
  const [isLoading, setIsLoading] = useState(false)

  // Only prefetch the route
  useEffect(() => {
    router.prefetch(`/events/${event._id}/register`)
  }, [event._id, router])

  const handleRegisterClick = () => {
    setIsLoading(true)
    router.push(`/events/${event._id}/register`)
  }

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">Sorry, registration is closed.</p>
      ) : (
        <Button 
          onClick={handleRegisterClick} 
          className="button rounded-full" 
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Register 报名'}
        </Button>
      )}
    </div>
  )
}

export default CheckoutButton