export const routeCacheConfig = {
  '/*': {
    revalidate: 3600,
    prefetch: true
  },
  '/events/*': {
    revalidate: 300,
    prefetch: true
  },
  '/events/details/*': {
    revalidate: 60,
    prefetch: true
  },
  '/api/events': {
    revalidate: 60,
    prefetch: true
  },
  '/api/events/*/counts': {
    revalidate: 30,
    prefetch: false
  },
  '/api/*': {
    revalidate: 0,
    prefetch: false
  },
  '/event-lookup': {
    revalidate: 0,
    prefetch: false
  }
}; 