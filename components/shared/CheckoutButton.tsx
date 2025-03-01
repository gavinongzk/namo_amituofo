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
        <p className="p-2 text-red-400 text-sm sm:text-base">
          <span className="block sm:inline">抱歉，报名已截止。</span>
          <span className="block sm:inline sm:ml-1">Sorry, registration is closed.</span>
        </p>
      ) : (
        <Button 
          onClick={handleRegisterClick} 
          className="button rounded-full min-w-[120px]" 
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex flex-col sm:flex-row sm:gap-1 text-xs sm:text-sm">
              <span>加载中...</span>
              <span>Loading...</span>
            </span>
          ) : (
            <span className="flex flex-col sm:flex-row sm:gap-1 text-xs sm:text-sm">
              <span>报名</span>
              <span>Register</span>
            </span>
          )}
        </Button>
      )}
    </div>
  )
}

export default CheckoutButton