export const routeCacheConfig = {
  '/*': {
    revalidate: 3600,
    prefetch: true
  },
  '/events/*': {
    revalidate: 300,
    prefetch: true
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