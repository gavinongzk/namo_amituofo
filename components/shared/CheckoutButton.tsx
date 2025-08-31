"use client"

import { IEvent } from '@/lib/database/models/event.model'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'

const CheckoutButton = ({ event }: { event: IEvent }) => {
  const router = useRouter()
  const daysAfterEnd = new Date(event.endDateTime)
  daysAfterEnd.setDate(daysAfterEnd.getDate() + 1)
  const hasEventFinished = new Date() > daysAfterEnd
  const [isLoading, setIsLoading] = useState(false)

  // Only prefetch the route
  useEffect(() => {
    router.prefetch(`/events/details/${event._id}/register`)
  }, [event._id, router])

  const handleRegisterClick = () => {
    setIsLoading(true)
    router.push(`/events/details/${event._id}/register`)
  }

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">抱歉，报名已截止。/ Sorry, registration is closed.</p>
      ) : (
        <Button 
          onClick={handleRegisterClick} 
          className="button rounded-full" 
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? '加载中... / Loading...' : '报名 / Register'}
        </Button>
      )}
    </div>
  )
}

export default CheckoutButton