import { NextRequest, NextResponse } from 'next/server';
import { multiLayerCache } from '@/lib/cache/multiLayer';
import { queryCache } from '@/lib/cache/queryCache';
import { redisCache } from '@/lib/cache/redis';
import { getCacheMetrics } from '@/lib/cache/config';

export async function GET(req: NextRequest) {
  try {
    // Get cache statistics
    const multiLayerStats = multiLayerCache.getStats();
    const queryStats = queryCache.stats();
    const redisAvailable = redisCache.isAvailable();
    const systemMetrics = getCacheMetrics();

    const stats = {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      
      // Multi-layer cache stats
      multiLayer: {
        ...multiLayerStats,
        efficiency: {
          hitRate: multiLayerStats.hitRate,
          memoryUtilization: multiLayerStats.memorySize / multiLayerStats.memoryMaxSize,
          totalRequests: multiLayerStats.memoryHits + multiLayerStats.memoryMisses,
        }
      },
      
      // Query cache stats
      queryCache: {
        ...queryStats,
        utilizationRate: queryStats.size / queryStats.maxSize,
      },
      
      // Redis status
      redis: {
        available: redisAvailable,
        status: redisAvailable ? 'connected' : 'disconnected',
      },
      
      // Performance metrics
      performance: {
        avgResponseTime: calculateAverageResponseTime(),
        cacheEfficiency: calculateCacheEfficiency(multiLayerStats),
        recommendations: generateRecommendations(multiLayerStats, queryStats),
      }
    };

    // Set cache control headers
    const response = NextResponse.json(stats);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache statistics' },
      { status: 500 }
    );
  }
}

// Clear all caches (admin only)
export async function DELETE(req: NextRequest) {
  try {
    // In a real app, add authentication check here
    const { searchParams } = new URL(req.url);
    const adminKey = searchParams.get('key');
    
    if (adminKey !== process.env.ADMIN_CACHE_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear all caches
    multiLayerCache.clear();
    queryCache.clear();
    
    return NextResponse.json({
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing caches:', error);
    return NextResponse.json(
      { error: 'Failed to clear caches' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateAverageResponseTime(): number {
  // This would be implemented with actual performance monitoring
  // For now, return a placeholder
  return 0;
}

function calculateCacheEfficiency(stats: any): number {
  const totalRequests = stats.memoryHits + stats.memoryMisses + stats.redisHits + stats.redisMisses;
  const totalHits = stats.memoryHits + stats.redisHits;
  
  return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
}

function generateRecommendations(multiLayerStats: any, queryStats: any): string[] {
  const recommendations: string[] = [];
  
  // Memory utilization recommendations
  if (multiLayerStats.memorySize / multiLayerStats.memoryMaxSize > 0.9) {
    recommendations.push('Consider increasing memory cache size');
  }
  
  // Hit rate recommendations
  if (multiLayerStats.hitRate < 0.5) {
    recommendations.push('Low cache hit rate - consider adjusting TTL values');
  }
  
  // Redis recommendations
  if (!multiLayerStats.redisAvailable) {
    recommendations.push('Redis is not available - consider setting up Redis for better performance');
  }
  
  // Query cache recommendations
  if (queryStats.size / queryStats.maxSize > 0.8) {
    recommendations.push('Query cache is nearly full - consider increasing capacity');
  }
  
  return recommendations;
} 