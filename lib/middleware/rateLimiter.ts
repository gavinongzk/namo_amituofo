import { NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

type RateLimitConfig = {
  uniqueTokenPerInterval?: number;
  interval?: number;
  limit: number;
};

export default class RateLimiter {
  private tokenCache: LRUCache<string, number[]>;

  constructor({ uniqueTokenPerInterval = 500, interval = 60000, limit }: RateLimitConfig) {
    this.tokenCache = new LRUCache({
      max: uniqueTokenPerInterval,
      ttl: interval,
    });
  }

  async check(token: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const tokenCount = this.tokenCache.get(token) || [];
    const now = Date.now();
    const windowStart = now - this.tokenCache.ttl!;

    // Filter out old timestamps
    const recentTokens = tokenCount.filter((timestamp) => timestamp > windowStart);

    // Add current request timestamp
    recentTokens.push(now);

    // Update cache
    this.tokenCache.set(token, recentTokens);

    const remaining = (this.tokenCache.max as number) - recentTokens.length;

    return {
      success: recentTokens.length <= (this.tokenCache.max as number),
      limit: this.tokenCache.max as number,
      remaining: Math.max(0, remaining),
      reset: windowStart + this.tokenCache.ttl!,
    };
  }
}

// Different rate limiters for different endpoints
const rateLimiters = {
  // More lenient limits for viewing events and registrations
  default: new RateLimiter({ limit: 60 }), // 60 requests per minute
  
  // Stricter limits for mutations and admin actions
  strict: new RateLimiter({ limit: 30 }), // 30 requests per minute
  
  // Very lenient for static content
  static: new RateLimiter({ limit: 120 }), // 120 requests per minute
};

export async function rateLimiterMiddleware(
  req: Request,
  strictLimit: boolean = false,
  isStatic: boolean = false
) {
  try {
    // Get IP address from various headers or fallback to a default
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    // Choose the appropriate rate limiter
    const limiter = isStatic 
      ? rateLimiters.static 
      : strictLimit 
        ? rateLimiters.strict 
        : rateLimiters.default;

    const result = await limiter.check(ip);

    // If rate limit is exceeded
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Continue to the next middleware/route handler
  } catch (error) {
    console.error('Rate limiter error:', error);
    return null; // Continue on error to avoid blocking requests
  }
} 