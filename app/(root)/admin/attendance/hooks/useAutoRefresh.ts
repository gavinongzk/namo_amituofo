import { useState, useEffect, useRef } from 'react';

interface UseAutoRefreshProps {
  onRefresh: () => void;
  scannerActive?: boolean;
}

export const useAutoRefresh = ({ onRefresh, scannerActive = false }: UseAutoRefreshProps) => {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize auto-refresh and timestamp on client-side only
    setAutoRefreshEnabled(true);
    setLastRefreshTime(Date.now());
  }, []);

  useEffect(() => {
    if (autoRefreshEnabled) {
      // Refresh more frequently when QR scanner is active for better UX
      const refreshInterval = scannerActive ? 10000 : 15000; // 10s when scanner active, 15s otherwise
      
      const interval = setInterval(() => {
        setLastRefreshTime(Date.now());
        onRefresh();
      }, refreshInterval);
      
      intervalRef.current = interval;

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, scannerActive, onRefresh]);

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(prev => !prev);
  };

  return {
    autoRefreshEnabled,
    lastRefreshTime,
    toggleAutoRefresh,
  };
}; 