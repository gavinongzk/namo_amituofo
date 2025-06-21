import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { useCallback } from 'react';

interface CachedSWROptions extends SWRConfiguration {
  staleTime?: number;
  cacheTime?: number;
  enabled?: boolean;
  retry?: boolean | number;
}

// Enhanced SWR hook with better caching
export const useCachedSWR = <T>(
  key: string | null,
  fetcher: (() => Promise<T>) | null,
  options: CachedSWROptions = {}
): SWRResponse<T, any> => {
  const {
    staleTime = 30000, // 30 seconds default stale time
    cacheTime = 300000, // 5 minutes default cache time
    enabled = true,
    retry = 3,
    ...swrOptions
  } = options;

  const swrKey = enabled && key ? key : null;
  const swrFetcher = enabled && fetcher ? fetcher : null;

  return useSWR(swrKey, swrFetcher, {
    dedupingInterval: 2000, // Dedupe requests within 2s
    focusThrottleInterval: 5000, // Throttle refetch on focus
    revalidateOnFocus: false, // Don't refetch on window focus by default
    revalidateOnReconnect: true, // Refetch on network reconnect
    revalidateIfStale: true, // Revalidate if data is stale
    errorRetryCount: typeof retry === 'number' ? retry : retry ? 3 : 0,
    errorRetryInterval: 1000, // 1 second between retries
    keepPreviousData: true, // Keep previous data while fetching new data
    ...swrOptions,
  });
};

// Hook for event data with optimized caching
export const useEventData = <T>(
  eventId: string | null,
  fetcher: (() => Promise<T>) | null,
  options: CachedSWROptions = {}
) => {
  const key = eventId ? `event:${eventId}:details` : null;
  
  return useCachedSWR(key, fetcher, {
    staleTime: 60000, // 1 minute stale time for events
    cacheTime: 300000, // 5 minutes cache time
    revalidateOnFocus: false,
    ...options,
  });
};

// Hook for event lists with pagination support
export const useEventList = <T>(
  country: string,
  category: string = '',
  page: number = 1,
  fetcher: (() => Promise<T>) | null,
  options: CachedSWROptions = {}
) => {
  const key = `events:list:${country}:${category}:${page}`;
  
  return useCachedSWR(key, fetcher, {
    staleTime: 60000, // 1 minute stale time
    cacheTime: 300000, // 5 minutes cache time
    revalidateOnFocus: false,
    ...options,
  });
};

// Hook for registration counts with frequent updates
export const useRegistrationCounts = <T>(
  eventId: string | null,
  fetcher: (() => Promise<T>) | null,
  options: CachedSWROptions = {}
) => {
  const key = eventId ? `event:${eventId}:counts` : null;
  
  return useCachedSWR(key, fetcher, {
    staleTime: 10000, // 10 seconds stale time for counts
    cacheTime: 60000, // 1 minute cache time
    refreshInterval: 30000, // Auto-refresh every 30 seconds
    revalidateOnFocus: true, // Refetch on focus for real-time data
    ...options,
  });
};

// Hook for user registrations
export const useUserRegistrations = <T>(
  phoneNumber: string | null,
  fetcher: (() => Promise<T>) | null,
  options: CachedSWROptions = {}
) => {
  const key = phoneNumber ? `user:registrations:${phoneNumber}` : null;
  
  return useCachedSWR(key, fetcher, {
    staleTime: 5000, // 5 seconds stale time for user data
    cacheTime: 30000, // 30 seconds cache time
    revalidateOnFocus: true,
    ...options,
  });
};

// Hook for categories with long-term caching
export const useCategories = <T>(
  fetcher: (() => Promise<T>) | null,
  includeHidden: boolean = false,
  options: CachedSWROptions = {}
) => {
  const key = `categories:${includeHidden}`;
  
  return useCachedSWR(key, fetcher, {
    staleTime: 600000, // 10 minutes stale time
    cacheTime: 1800000, // 30 minutes cache time
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    ...options,
  });
};

// Hook for analytics data
export const useAnalytics = <T>(
  type: string | null,
  period: string | null,
  fetcher: (() => Promise<T>) | null,
  options: CachedSWROptions = {}
) => {
  const key = type && period ? `analytics:${type}:${period}` : null;
  
  return useCachedSWR(key, fetcher, {
    staleTime: 120000, // 2 minutes stale time
    cacheTime: 600000, // 10 minutes cache time
    revalidateOnFocus: false,
    ...options,
  });
};

// Hook for order details
export const useOrderDetails = <T>(
  orderId: string | null,
  fetcher: (() => Promise<T>) | null,
  options: CachedSWROptions = {}
) => {
  const key = orderId ? `order:${orderId}:details` : null;
  
  return useCachedSWR(key, fetcher, {
    staleTime: 30000, // 30 seconds stale time
    cacheTime: 120000, // 2 minutes cache time
    revalidateOnFocus: true,
    ...options,
  });
};

// Hook with automatic retry and error handling
export const useRobustSWR = <T>(
  key: string | null,
  fetcher: (() => Promise<T>) | null,
  options: CachedSWROptions = {}
) => {
  const enhancedFetcher = useCallback(async () => {
    if (!fetcher) return null;
    
    try {
      return await fetcher();
    } catch (error) {
      // Log error for monitoring
      console.error(`SWR fetch error for key: ${key}`, error);
      throw error;
    }
  }, [fetcher, key]);

  return useCachedSWR(key, enhancedFetcher, {
    retry: 3,
    retryDelay: (attempt) => Math.min(attempt * 1000, 3000), // Exponential backoff
    onError: (error) => {
      console.error(`SWR error for key: ${key}`, error);
    },
    ...options,
  });
};

// Hook for real-time data with polling
export const useRealTimeSWR = <T>(
  key: string | null,
  fetcher: (() => Promise<T>) | null,
  intervalMs: number = 30000,
  options: CachedSWROptions = {}
) => {
  return useCachedSWR(key, fetcher, {
    refreshInterval: intervalMs,
    staleTime: intervalMs / 2,
    cacheTime: intervalMs * 2,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    ...options,
  });
};

// Custom hook for prefetching data
export const usePrefetch = () => {
  const prefetch = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>
  ) => {
    try {
      // Use SWR's mutate to prefetch and cache data
      const { mutate } = await import('swr');
      await mutate(key, fetcher());
    } catch (error) {
      console.error(`Prefetch error for key: ${key}`, error);
    }
  }, []);

  return { prefetch };
};
