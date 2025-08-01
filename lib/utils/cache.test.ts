// Simple test file for cache utility functions
// This is a basic test to verify the cache clearing functionality

import { clearAllClientCache, isClientSideError, getErrorMessage } from './cache';

// Mock browser APIs for testing
const mockLocalStorage = {
  clear: jest.fn(),
};

const mockSessionStorage = {
  clear: jest.fn(),
};

const mockCaches = {
  keys: jest.fn().mockResolvedValue(['cache1', 'cache2']),
  delete: jest.fn().mockResolvedValue(true),
};

const mockServiceWorker = {
  getRegistrations: jest.fn().mockResolvedValue([
    { unregister: jest.fn().mockResolvedValue(true) }
  ]),
};

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'testCookie=value; anotherCookie=value2',
});

// Mock window APIs
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

Object.defineProperty(window, 'caches', {
  value: mockCaches,
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
});

describe('Cache Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clearAllClientCache', () => {
    it('should clear all client-side cache successfully', async () => {
      await clearAllClientCache();
      
      expect(mockLocalStorage.clear).toHaveBeenCalled();
      expect(mockSessionStorage.clear).toHaveBeenCalled();
      expect(mockCaches.keys).toHaveBeenCalled();
      expect(mockCaches.delete).toHaveBeenCalledTimes(2);
      expect(mockServiceWorker.getRegistrations).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockLocalStorage.clear.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(clearAllClientCache()).rejects.toThrow('Storage error');
    });
  });

  describe('isClientSideError', () => {
    it('should identify network errors as client-side', () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      expect(isClientSideError(networkError)).toBe(true);
    });

    it('should identify TypeError as client-side', () => {
      const typeError = new TypeError('fetch is not defined');
      
      expect(isClientSideError(typeError)).toBe(true);
    });

    it('should identify fetch-related errors as client-side', () => {
      const fetchError = new Error('fetch failed');
      fetchError.message = 'fetch failed';
      
      expect(isClientSideError(fetchError)).toBe(true);
    });

    it('should identify errors without response as client-side', () => {
      const error = new Error('Some error');
      
      expect(isClientSideError(error)).toBe(true);
    });

    it('should not identify server errors as client-side', () => {
      const serverError = new Error('Server error');
      (serverError as any).response = { status: 500 };
      
      expect(isClientSideError(serverError)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return network error message', () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const message = getErrorMessage(networkError);
      expect(message).toContain('Network connection error');
    });

    it('should return fetch error message', () => {
      const fetchError = new TypeError('fetch is not defined');
      
      const message = getErrorMessage(fetchError);
      expect(message).toContain('Request failed');
    });

    it('should return timeout error message', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.message = 'Request timeout';
      
      const message = getErrorMessage(timeoutError);
      expect(message).toContain('Request timeout');
    });

    it('should return CORS error message', () => {
      const corsError = new Error('CORS error');
      corsError.message = 'CORS error';
      
      const message = getErrorMessage(corsError);
      expect(message).toContain('CORS error');
    });

    it('should return generic error message for unknown errors', () => {
      const unknownError = new Error('Unknown error');
      
      const message = getErrorMessage(unknownError);
      expect(message).toContain('An unknown error occurred');
    });
  });
}); 