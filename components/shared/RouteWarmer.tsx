'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { preloadEvents } from '@/lib/actions/preload';
import dynamic from 'next/dynamic';

export function RouteWarmer() {
  const router = useRouter();
  const pathname = usePathname();
  const preloadedRef = useRef({
    home: false,
    eventDetails: new Set<string>()
  });

  const warmHomeRoute = useCallback(async () => {
    router.prefetch('/events');
    
    // Only preload events if not already done
    if (!preloadedRef.current.home) {
      // Use requestIdleCallback with higher priority for critical resources
      const preloadWithPriority = () => {
        // Start with Singapore events first (assuming most common)
        void preloadEvents('Singapore');
        
        // Add a delay for the second country to reduce network contention
        setTimeout(() => {
          void preloadEvents('Malaysia');
        }, 2000);
        
        preloadedRef.current.home = true;
      };
      
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preloadWithPriority, { timeout: 2000 });
      } else {
        // Fallback with lower timeout
        setTimeout(preloadWithPriority, 1000);
      }
    }
    
    // Dynamically import main components only when network is idle
    if ('connection' in navigator && (navigator as any).connection.saveData === false) {
      // Don't preload if user has save-data enabled
      const EventList = dynamic(() => import('@/components/shared/EventList'));
      const CategoryFilter = dynamic(() => import('@/components/shared/CategoryFilter'));
    }
  }, [router]);

  const warmEventDetailsRoute = useCallback(async (eventId: string) => {
    // Avoid duplicate preloading
    if (preloadedRef.current.eventDetails.has(eventId)) {
      return;
    }
    
    const registerPath = `/events/details/${eventId}/register`;
    router.prefetch(registerPath);
    
    // Track that we've preloaded this event
    preloadedRef.current.eventDetails.add(eventId);
    
    // Preload registration form with lower priority
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        const RegisterFormWrapper = dynamic(() => 
          import('@/components/shared/RegisterFormWrapper')
        );
      }, { timeout: 4000 });
    }
  }, [router]);

  useEffect(() => {
    const warmRoutes = async () => {
      try {
        // Don't warm routes if the user has indicated they want to save data
        if ('connection' in navigator && (navigator as any).connection.saveData) {
          return;
        }
        
        // Preload data and components based on current route
        if (pathname === '/' || pathname === '/events') {
          await warmHomeRoute();
        } 
        else if (pathname.startsWith('/events/details/')) {
          const eventId = pathname.split('/')[3];
          if (eventId && !pathname.includes('/register')) {
            await warmEventDetailsRoute(eventId);
          }
        }
      } catch (error) {
        console.error('Error warming routes:', error);
      }
    };
    
    // Use requestIdleCallback with a reasonable timeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => warmRoutes(), { timeout: 2000 });
    } else {
      setTimeout(warmRoutes, 1000);
    }
  }, [pathname, warmHomeRoute, warmEventDetailsRoute]);

  return null;
}
