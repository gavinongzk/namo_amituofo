// Client-side caching utility to reduce API calls
class ClientCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

export const clientCache = new ClientCache();

// Cache keys for common data
export const CACHE_KEYS = {
  EVENTS: 'events',
  CATEGORIES: 'categories',
  USER_REGISTRATIONS: 'user-registrations',
  EVENT_DETAILS: (id: string) => `event-${id}`,
  ORDER_DETAILS: (id: string) => `order-${id}`,
} as const; 