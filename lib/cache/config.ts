// Cache configuration and utilities
export const CACHE_CONFIG = {
  // Environment-based cache settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Redis configuration
  redis: {
    enabled: Boolean(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL),
    url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL,
    maxRetries: 3,
    retryDelay: 100,
  },
  
  // Memory cache limits
  memory: {
    maxSize: process.env.NODE_ENV === 'production' ? 1000 : 500,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
  },
  
  // Cache durations in seconds
  durations: {
    // Static content
    staticAssets: 24 * 60 * 60, // 24 hours
    images: 24 * 60 * 60, // 24 hours
    
    // Event data
    eventDetails: 5 * 60, // 5 minutes
    eventList: 5 * 60, // 5 minutes
    categories: 30 * 60, // 30 minutes
    
    // Dynamic data
    registrationCounts: 30, // 30 seconds
    attendeeLists: 60, // 1 minute
    eventStats: 30, // 30 seconds
    
    // User data
    userRegistrations: 10, // 10 seconds
    userOrders: 30, // 30 seconds
    
    // Analytics
    analytics: 5 * 60, // 5 minutes
    reports: 10 * 60, // 10 minutes
  },
  
  // Feature flags
  features: {
    enableRedis: Boolean(process.env.ENABLE_REDIS_CACHE) !== false,
    enableMemoryCache: true,
    enableQueryCache: true,
    enableSWRCache: true,
    enablePreloading: process.env.NODE_ENV === 'production',
  },
  
  // Debug settings
  debug: {
    logCacheHits: process.env.NODE_ENV === 'development',
    logCacheMisses: process.env.NODE_ENV === 'development',
    logInvalidations: true,
  },
} as const;

// Cache key prefixes
export const CACHE_PREFIXES = {
  event: 'evt',
  user: 'usr',
  order: 'ord',
  category: 'cat',
  analytics: 'ana',
  admin: 'adm',
} as const;

// Utility functions
export const getCacheKey = (prefix: keyof typeof CACHE_PREFIXES, ...parts: string[]) => {
  return `${CACHE_PREFIXES[prefix]}:${parts.join(':')}`;
};

export const getCacheTTL = (type: keyof typeof CACHE_CONFIG.durations) => {
  return CACHE_CONFIG.durations[type];
};

export const shouldUseCache = (feature: keyof typeof CACHE_CONFIG.features) => {
  return CACHE_CONFIG.features[feature];
};

// Cache warming strategies
export const WARMUP_QUERIES = {
  // Queries to run on app startup
  startup: [
    'categories',
    'events:list:Singapore',
    'events:list:Malaysia',
  ],
  
  // Queries to run periodically
  periodic: [
    'analytics:daily',
    'events:popular',
  ],
} as const;

// Cache monitoring
export const getCacheMetrics = () => {
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    redisEnabled: CACHE_CONFIG.redis.enabled,
    memoryLimits: CACHE_CONFIG.memory,
  };
}; 