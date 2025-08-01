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

// Comprehensive cache clearing utility for handling client-side errors
export const clearAllClientCache = async (): Promise<void> => {
  try {
    // Clear client cache
    clientCache.clear();
    
    // Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
    
    // Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
    
    // Clear browser cache for the current page
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // Clear any service worker cache
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
    }
    
    // Clear specific cookies that might cause issues
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    }
    
    console.log('All client-side cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};

// Function to detect if an error is likely a client-side issue
export const isClientSideError = (error: any): boolean => {
  return (
    error.name === 'TypeError' ||
    error.name === 'NetworkError' ||
    error.name === 'ReferenceError' ||
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('cors') ||
    error.message?.includes('timeout') ||
    !error.response
  );
};

// Function to get user-friendly error message
export const getErrorMessage = (error: any): string => {
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return "网络连接错误，请检查网络后重试。/ Network connection error. Please check your connection and try again.";
  } else if (error.name === 'TypeError' || error.message?.includes('fetch')) {
    return "请求失败，可能是缓存问题。/ Request failed, possibly due to cache issues.";
  } else if (error.message?.includes('timeout')) {
    return "请求超时，请重试。/ Request timeout. Please try again.";
  } else if (error.message?.includes('cors')) {
    return "跨域请求错误，请刷新页面重试。/ CORS error. Please refresh the page and try again.";
  } else if (error.message) {
    return error.message;
  } else {
    return "发生未知错误，请重试。/ An unknown error occurred. Please try again.";
  }
};

// Cache keys for common data
export const CACHE_KEYS = {
  EVENTS: 'events',
  CATEGORIES: 'categories',
  USER_REGISTRATIONS: 'user-registrations',
  EVENT_DETAILS: (id: string) => `event-${id}`,
  ORDER_DETAILS: (id: string) => `order-${id}`,
} as const; 