import Redis from 'ioredis';

class RedisCache {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
      
      if (!redisUrl) {
        console.warn('Redis URL not provided, falling back to memory cache only');
        return;
      }

      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.redis.ping();
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.redis = null;
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(
    key: string, 
    value: any, 
    ttlSeconds: number = 300
  ): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isConnected && this.redis !== null;
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const redisCache = new RedisCache();

// Convenience functions
export const getFromCache = async <T>(key: string): Promise<T | null> => {
  return redisCache.get<T>(key);
};

export const setCache = async (
  key: string, 
  value: any, 
  ttlSeconds: number = 300
): Promise<boolean> => {
  return redisCache.set(key, value, ttlSeconds);
};

export const deleteFromCache = async (key: string): Promise<boolean> => {
  return redisCache.del(key);
};

export const invalidatePattern = async (pattern: string): Promise<boolean> => {
  return redisCache.invalidatePattern(pattern);
};
