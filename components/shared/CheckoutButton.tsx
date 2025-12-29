"use client"

import { IEvent } from '@/lib/database/models/event.model'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'

const CheckoutButton = ({ event }: { event: IEvent }) => {
  const router = useRouter()
  const daysAfterEnd = new Date(event.endDateTime)
  daysAfterEnd.setDate(daysAfterEnd.getDate() + 7)
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
    <div className="flex w-full items-center">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">抱歉，报名已截止。/ Sorry, registration is closed.</p>
      ) : (
        <Button 
          onClick={handleRegisterClick} 
          aria-label="报名 / Register"
          className="button cta-button cta-attention w-full sm:w-auto sm:min-w-[240px] bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
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