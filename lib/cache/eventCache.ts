import { getCached, invalidateCachedByTag, invalidateCachedPattern } from './multiLayer';

// Cache duration constants (in seconds)
export const CACHE_DURATIONS = {
  // Static event data - longer cache
  EVENT_DETAILS: 300, // 5 minutes
  EVENT_LIST: 300, // 5 minutes
  CATEGORIES: 1800, // 30 minutes
  
  // Dynamic registration data - shorter cache
  REGISTRATION_COUNTS: 30, // 30 seconds
  ATTENDEE_LIST: 60, // 1 minute
  EVENT_STATS: 30, // 30 seconds
  
  // User-specific data - very short cache
  USER_REGISTRATIONS: 10, // 10 seconds
  USER_ORDERS: 30, // 30 seconds
  
  // Analytics data - moderate cache
  ANALYTICS: 300, // 5 minutes
  REPORTS: 600, // 10 minutes
} as const;

// Cache key generators
export const cacheKeys = {
  eventDetails: (eventId: string) => `event:${eventId}:details`,
  eventList: (country: string, category?: string, page?: number) => 
    `events:list:${country}:${category || 'all'}:${page || 1}`,
  eventCounts: (eventId: string) => `event:${eventId}:counts`,
  eventAttendees: (eventId: string) => `event:${eventId}:attendees`,
  eventStats: (eventId: string) => `event:${eventId}:stats`,
  userRegistrations: (userId: string) => `user:${userId}:registrations`,
  userOrders: (userId: string) => `user:${userId}:orders`,
  userOrdersByPhone: (phoneNumber: string) => `phone:${phoneNumber}:orders`,
  categories: (includeHidden: boolean = false) => `categories:${includeHidden}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  orderDetails: (orderId: string) => `order:${orderId}:details`,
  adminEventList: (country: string) => `admin:events:${country}`,
} as const;

// Event caching functions
export const eventCache = {
  // Get event details with caching
  async getEventDetails<T>(
    eventId: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return getCached(
      cacheKeys.eventDetails(eventId),
      queryFn,
      {
        ttl: CACHE_DURATIONS.EVENT_DETAILS,
        tags: ['events', `event:${eventId}`],
        useRedis: true,
      }
    );
  },

  // Get event list with caching
  async getEventList<T>(
    country: string,
    queryFn: () => Promise<T>,
    category?: string,
    page?: number
  ): Promise<T> {
    return getCached(
      cacheKeys.eventList(country, category, page),
      queryFn,
      {
        ttl: CACHE_DURATIONS.EVENT_LIST,
        tags: ['events', 'event-list', `country:${country}`],
        useRedis: true,
      }
    );
  },

  // Get registration counts with short-term caching
  async getRegistrationCounts<T>(
    eventId: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return getCached(
      cacheKeys.eventCounts(eventId),
      queryFn,
      {
        ttl: CACHE_DURATIONS.REGISTRATION_COUNTS,
        tags: ['registrations', `event:${eventId}`, 'counts'],
        useRedis: true,
      }
    );
  },

  // Get user registrations with very short caching
  async getUserRegistrations<T>(
    userId: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return getCached(
      cacheKeys.userRegistrations(userId),
      queryFn,
      {
        ttl: CACHE_DURATIONS.USER_REGISTRATIONS,
        tags: ['user-data', `user:${userId}`, 'registrations'],
        useRedis: false, // Don't use Redis for user-specific data
      }
    );
  },

  // Get user orders by phone number
  async getUserOrdersByPhone<T>(
    phoneNumber: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return getCached(
      cacheKeys.userOrdersByPhone(phoneNumber),
      queryFn,
      {
        ttl: CACHE_DURATIONS.USER_ORDERS,
        tags: ['user-data', 'orders', `phone:${phoneNumber}`],
        useRedis: false,
      }
    );
  },

  // Get categories with long-term caching
  async getCategories<T>(
    queryFn: () => Promise<T>,
    includeHidden: boolean = false
  ): Promise<T> {
    return getCached(
      cacheKeys.categories(includeHidden),
      queryFn,
      {
        ttl: CACHE_DURATIONS.CATEGORIES,
        tags: ['categories'],
        useRedis: true,
      }
    );
  },

  // Get order details
  async getOrderDetails<T>(
    orderId: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return getCached(
      cacheKeys.orderDetails(orderId),
      queryFn,
      {
        ttl: CACHE_DURATIONS.USER_ORDERS,
        tags: ['orders', `order:${orderId}`],
        useRedis: true,
      }
    );
  },

  // Get analytics data
  async getAnalytics<T>(
    type: string,
    period: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return getCached(
      cacheKeys.analytics(type, period),
      queryFn,
      {
        ttl: CACHE_DURATIONS.ANALYTICS,
        tags: ['analytics', `analytics:${type}`],
        useRedis: true,
      }
    );
  },
};

// Cache invalidation strategies
export const invalidateEventCache = {
  // Invalidate when event is updated
  async onEventUpdate(eventId: string): Promise<void> {
    await Promise.all([
      invalidateCachedByTag(`event:${eventId}`),
      invalidateCachedByTag('event-list'),
      invalidateCachedPattern('events:list:*'),
    ]);
  },

  // Invalidate when someone registers/cancels
  async onRegistrationChange(eventId: string): Promise<void> {
    await Promise.all([
      invalidateCachedByTag('counts'),
      invalidateCachedByTag('registrations'),
      invalidateCachedPattern(`event:${eventId}:counts`),
      invalidateCachedPattern(`event:${eventId}:attendees`),
      invalidateCachedPattern(`event:${eventId}:stats`),
    ]);
  },

  // Invalidate user-specific data
  async onUserDataChange(userId: string, phoneNumber?: string): Promise<void> {
    const promises = [
      invalidateCachedByTag(`user:${userId}`),
    ];

    if (phoneNumber) {
      promises.push(invalidateCachedByTag(`phone:${phoneNumber}`));
    }

    await Promise.all(promises);
  },

  // Invalidate categories when updated
  async onCategoryUpdate(): Promise<void> {
    await invalidateCachedByTag('categories');
  },

  // Invalidate all event-related caches
  async onMajorEventUpdate(): Promise<void> {
    await Promise.all([
      invalidateCachedByTag('events'),
      invalidateCachedByTag('event-list'),
      invalidateCachedByTag('counts'),
      invalidateCachedPattern('events:*'),
      invalidateCachedPattern('admin:events:*'),
    ]);
  },

  // Invalidate order-related caches
  async onOrderUpdate(orderId: string): Promise<void> {
    await invalidateCachedByTag(`order:${orderId}`);
  },
};
