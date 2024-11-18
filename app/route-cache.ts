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
    revalidate: 60,
    prefetch: false
  }
}; 