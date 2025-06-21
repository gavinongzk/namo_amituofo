import { LRUCache } from 'lru-cache';
import { redisCache } from './redis';

interface CacheOptions {
  ttl?: number;
  useRedis?: boolean;
  tags?: string[];
}

interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  redisHits: number;
  redisMisses: number;
  dbQueries: number;
}

class MultiLayerCache {
  private memoryCache: LRUCache<string, any>;
  private stats: CacheStats;
  private tagIndex: Map<string, Set<string>>;

  constructor() {
    this.memoryCache = new LRUCache({
      max: 500, // Store up to 500 items in memory
      ttl: 60000, // 1 minute TTL for memory cache
      allowStale: true,
    });

    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      redisHits: 0,
      redisMisses: 0,
      dbQueries: 0,
    };

    this.tagIndex = new Map();
  }

  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = 300, useRedis = true, tags = [] } = options;

    // Layer 1: Memory cache (fastest)
    let result = this.memoryCache.get(key);
    if (result !== undefined) {
      this.stats.memoryHits++;
      return result as T;
    }
    this.stats.memoryMisses++;

    // Layer 2: Redis cache (medium speed)
    if (useRedis && redisCache.isAvailable()) {
      result = await redisCache.get<T>(key);
      if (result !== null) {
        this.stats.redisHits++;
        // Store in memory cache for faster subsequent access
        this.memoryCache.set(key, result);
        return result;
      }
      this.stats.redisMisses++;
    }

    // Layer 3: Database query (slowest)
    this.stats.dbQueries++;
    result = await queryFn();

    // Store in all available caches
    this.set(key, result, { ttl, useRedis, tags });

    return result;
  }

  async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = 300, useRedis = true, tags = [] } = options;

    // Store in memory cache
    this.memoryCache.set(key, value);

    // Store in Redis cache if available
    if (useRedis && redisCache.isAvailable()) {
      await redisCache.set(key, value, ttl);
    }

    // Update tag index
    if (tags.length > 0) {
      tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      });
    }
  }

  async invalidate(key: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from Redis cache
    if (redisCache.isAvailable()) {
      await redisCache.del(key);
    }

    // Update tag index
    this.tagIndex.forEach((keys, tag) => {
      if (keys.has(key)) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return;

    const keyArray = Array.from(keys);
    
    // Remove from memory cache
    keyArray.forEach(key => this.memoryCache.delete(key));

    // Remove from Redis cache
    if (redisCache.isAvailable() && keyArray.length > 0) {
      await Promise.all(keyArray.map(key => redisCache.del(key)));
    }

    // Clear tag index
    this.tagIndex.delete(tag);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];

    // Collect keys from memory cache
    this.memoryCache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    // Remove from memory cache
    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // Remove from Redis cache
    if (redisCache.isAvailable()) {
      await redisCache.invalidatePattern(pattern);
    }

    // Update tag index
    this.tagIndex.forEach((keys, tag) => {
      keysToDelete.forEach(key => {
        if (keys.has(key)) {
          keys.delete(key);
          if (keys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    });
  }

  getStats(): CacheStats & {
    memorySize: number;
    memoryMaxSize: number;
    hitRate: number;
    redisAvailable: boolean;
  } {
    const totalRequests = this.stats.memoryHits + this.stats.memoryMisses;
    const hitRate = totalRequests > 0 ? 
      (this.stats.memoryHits + this.stats.redisHits) / totalRequests : 0;

    return {
      ...this.stats,
      memorySize: this.memoryCache.size,
      memoryMaxSize: this.memoryCache.max as number,
      hitRate: Math.round(hitRate * 100) / 100,
      redisAvailable: redisCache.isAvailable(),
    };
  }

  clear(): void {
    this.memoryCache.clear();
    this.tagIndex.clear();
  }
}

// Singleton instance
export const multiLayerCache = new MultiLayerCache();

// Convenience functions
export const getCached = async <T>(
  key: string,
  queryFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> => {
  return multiLayerCache.get(key, queryFn, options);
};

export const setCached = async (
  key: string,
  value: any,
  options?: CacheOptions
): Promise<void> => {
  return multiLayerCache.set(key, value, options);
};

export const invalidateCached = async (key: string): Promise<void> => {
  return multiLayerCache.invalidate(key);
};

export const invalidateCachedByTag = async (tag: string): Promise<void> => {
  return multiLayerCache.invalidateByTag(tag);
};

export const invalidateCachedPattern = async (pattern: string): Promise<void> => {
  return multiLayerCache.invalidatePattern(pattern);
};
