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
    router.prefetch(`/events/${event.slug}/register`)
  }, [event.slug, router])

  const handleRegisterClick = () => {
    setIsLoading(true)
    router.push(`/events/${event.slug}/register`)
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