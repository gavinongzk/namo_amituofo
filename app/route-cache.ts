export const routeCacheConfig = {
  // Static pages - cache for longer
  '/*': {
    revalidate: 3600, // 1 hour for general pages
    prefetch: true
  },
  
  // Event listings - moderate cache
  '/events': {
    revalidate: 300, // 5 minutes for event listings
    prefetch: true
  },
  '/events/*': {
    revalidate: 300, // 5 minutes for event pages
    prefetch: true
  },
  '/events/details/*': {
    revalidate: 300, // 5 minutes for event details
    prefetch: true
  },
  
  // API endpoints - dynamic data
  '/api/events': {
    revalidate: 0, // No cache for real-time data
    prefetch: false
  },
  '/api/events/*/counts': {
    revalidate: 0, // No cache for real-time counts
    prefetch: false
  },
  '/api/events/*/attendees': {
    revalidate: 0, // No cache for attendance data
    prefetch: false
  },
  
  // User-specific or sensitive endpoints - no cache
  '/api/users/*': {
    revalidate: 0,
    prefetch: false
  },
  '/api/createOrder/*': {
    revalidate: 0,
    prefetch: false
  },
  '/api/reg/*': {
    revalidate: 0,
    prefetch: false
  },
  
  // Analytics and monitoring - short cache
  '/api/analytics/*': {
    revalidate: 300, // 5 minutes for analytics
    prefetch: false
  },
  '/api/monitoring/*': {
    revalidate: 60, // 1 minute for monitoring data
    prefetch: false
  },
  
  // General API endpoints
  '/api/*': {
    revalidate: 0, // Default to no cache for API endpoints
    prefetch: false
  },
  
  // Event lookup - real-time
  '/event-lookup': {
    revalidate: 0,
    prefetch: false
  }
}; 