'use client'

import { useState, useEffect } from 'react'

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine)

    // Add event listeners for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-white shadow-lg">
      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <span>You are offline</span>
    </div>
  )
}

export default NetworkStatus 