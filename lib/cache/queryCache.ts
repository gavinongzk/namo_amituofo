import { LRUCache } from 'lru-cache';

interface CacheOptions {
  ttl?: number;
  maxAge?: number;
  tags?: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  tags: string[];
}

class QueryCache {
  private cache: LRUCache<string, CacheEntry<any>>;
  private tagIndex: Map<string, Set<string>>;

  constructor() {
    this.cache = new LRUCache<string, CacheEntry<any>>({
      max: 1000, // Store up to 1000 query results
      ttl: 1000 * 60 * 5, // Default 5 minutes TTL
      allowStale: true, // Allow stale data while revalidating
    });
    
    this.tagIndex = new Map();
  }

  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = 1000 * 60 * 5, tags = [] } = options;
    
    const cached = this.cache.get(key);
    
    if (cached && this.isValid(cached, ttl)) {
      return cached.data;
    }

    // Execute query and cache result
    const result = await queryFn();
    const entry: CacheEntry<T> = {
      data: result,
      timestamp: Date.now(),
      tags,
    };

    this.cache.set(key, entry);
    
    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    return result;
  }

  private isValid<T>(entry: CacheEntry<T>, ttl: number): boolean {
    return Date.now() - entry.timestamp < ttl;
  }

  invalidate(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      // Remove from tag index
      entry.tags.forEach(tag => {
        const keys = this.tagIndex.get(tag);
        if (keys) {
          keys.delete(key);
          if (keys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }
    this.cache.delete(key);
  }

  invalidateByTag(tag: string): void {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      keys.forEach(key => this.invalidate(key));
    }
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.invalidate(key));
  }

  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  stats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      tags: this.tagIndex.size,
    };
  }
}

// Singleton instance
export const queryCache = new QueryCache();

// Convenience functions
export const getCachedQuery = async <T>(
  key: string,
  queryFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> => {
  return queryCache.get(key, queryFn, options);
};

export const invalidateCache = (key: string) => queryCache.invalidate(key);
export const invalidateCacheByTag = (tag: string) => queryCache.invalidateByTag(tag);
export const invalidateCachePattern = (pattern: string) => queryCache.invalidatePattern(pattern);
