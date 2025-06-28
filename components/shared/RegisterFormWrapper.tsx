'use client';

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getOrderCountByEvent } from '@/lib/actions/order.actions'
import { IEvent } from '@/lib/database/models/event.model'
import { CategoryName } from '@/constants'
import RegisterFormClient from './RegisterFormClient'
import { RegisterFormSkeleton } from './RegisterFormSkeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw, RotateCcw, Pause, Play } from 'lucide-react'

function RegisterFormWrapper({ 
  event 
}: { 
  event: IEvent & { category: { name: CategoryName } }
}) {
  const [initialOrderCount, setInitialOrderCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const fetchOrderCount = async () => {
    try {
      const count = await getOrderCountByEvent(event._id);
      setInitialOrderCount(count);
    } catch (error) {
      console.error('Error fetching order count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullPageRefresh = async () => {
    setIsRefreshing(true);
    // Option 1: Use Next.js router refresh (recommended)
    router.refresh();
    
    // Option 2: Alternative - Force a complete page reload
    // window.location.reload();
    
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setLastRefreshTime(Date.now());
    await fetchOrderCount();
    setIsRefreshing(false);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => !prev);
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshEnabled) {
      // Check for new registrations every 15 seconds
      const refreshInterval = 15000;
      
      const interval = setInterval(async () => {
        setLastRefreshTime(Date.now());
        const currentCount = await getOrderCountByEvent(event._id);
        
        // If there are new registrations, refresh the page
        if (currentCount > initialOrderCount) {
          console.log(`New registrations detected: ${currentCount} > ${initialOrderCount}`);
          setInitialOrderCount(currentCount);
          // Optionally show a toast notification
          if (typeof window !== 'undefined' && window.location) {
            router.refresh();
          }
        } else {
          setInitialOrderCount(currentCount);
        }
      }, refreshInterval);
      
      autoRefreshIntervalRef.current = interval;

      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
          autoRefreshIntervalRef.current = null;
        }
      };
    }
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, initialOrderCount, event._id, router]);

  useEffect(() => {
    fetchOrderCount();
  }, [event._id]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return <RegisterFormSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">当前报名人数 / Current Registrations: </span>
            <span className="font-bold text-primary-600">{initialOrderCount}</span>
            {event.maxSeats && (
              <>
                <span className="mx-1">/</span>
                <span className="font-bold">{event.maxSeats}</span>
              </>
            )}
          </div>
          
          {autoRefreshEnabled && lastRefreshTime > 0 && (
            <div className="text-xs text-gray-500">
              上次更新 / Last updated: {new Date(lastRefreshTime).toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {/* Auto-refresh toggle */}
          <Button
            onClick={toggleAutoRefresh}
            variant={autoRefreshEnabled ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {autoRefreshEnabled ? (
              <>
                <Pause className="h-4 w-4" />
                停止自动刷新 / Stop Auto-refresh
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                启用自动刷新 / Enable Auto-refresh
              </>
            )}
          </Button>

          {/* Manual refresh */}
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中... / Refreshing...' : '手动刷新 / Manual Refresh'}
          </Button>

          {/* Full page refresh */}
          <Button
            onClick={handleFullPageRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新页面 / Refresh Page
          </Button>
        </div>
      </div>
      
      <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterFormClient 
          event={event} 
          initialOrderCount={initialOrderCount}
          onRefresh={autoRefreshEnabled ? handleManualRefresh : handleFullPageRefresh}
        />
      </Suspense>
    </div>
  )
}

export default RegisterFormWrapper
