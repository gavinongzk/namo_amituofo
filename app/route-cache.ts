export const routeCacheConfig = {
  '/*': {
    revalidate: 3600,
    prefetch: true
  },
  '/events/*': {
    revalidate: 300,
    prefetch: true
  },
  '/api/events/*': {
    revalidate: 60,
    prefetch: false
  },
  '/api/analytics/*': {
    revalidate: 1800,
    prefetch: false
  },
  '/event-lookup/*': {
    revalidate: 60,
    prefetch: true
  },
  '/profile/*': {
    revalidate: 300,
    prefetch: true
  }
}; 