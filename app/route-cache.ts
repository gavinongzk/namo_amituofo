export const routeCacheConfig = {
  '/*': {
    revalidate: 3600,
    prefetch: true,
    staleWhileRevalidate: 7200
  },
  '/events/*': {
    revalidate: 300,
    prefetch: true,
    staleWhileRevalidate: 600
  },
  '/api/*': {
    revalidate: 0,
    prefetch: false
  },
  '/static/*': {
    revalidate: 86400, // 24 hours
    prefetch: true
  },
  '/event-lookup': {
    revalidate: 0,
    prefetch: false
  }
}; 