'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { preloadEvents } from '@/lib/actions/preload';
import dynamic from 'next/dynamic';

export function RouteWarmer() {
  const router = useRouter();
  const pathname = usePathname();
  const preloadedRef = useRef(false);

  const warmHomeRoute = useCallback(async () => {
    router.prefetch('/events');
    
    // Only preload events if not already done
    if (!preloadedRef.current) {
      // Use requestIdleCallback to preload events when browser is idle
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          void preloadEvents('Singapore');
          
          // Stagger the second preload to avoid overwhelming the network
          setTimeout(() => {
            void preloadEvents('Malaysia');
          }, 1000);
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          void preloadEvents('Singapore');
          
          setTimeout(() => {
            void preloadEvents('Malaysia');
          }, 1000);
        }, 1000);
      }
      
      preloadedRef.current = true;
    }
    
    // Dynamically import main components
    const EventList = dynamic(() => import('@/components/shared/EventList'));
    const CategoryFilter = dynamic(() => import('@/components/shared/CategoryFilter'));
  }, [router]);

  const warmEventDetailsRoute = useCallback(async (eventId: string) => {
    const registerPath = `/events/details/${eventId}/register`;
    router.prefetch(registerPath);
    
    // Preload registration form
    const RegisterFormWrapper = dynamic(() => 
      import('@/components/shared/RegisterFormWrapper')
    );
  }, [router]);

  useEffect(() => {
    const warmRoutes = async () => {
      try {
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
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => warmRoutes());
    } else {
      setTimeout(warmRoutes, 1000);
    }
  }, [pathname, warmHomeRoute, warmEventDetailsRoute]);

  return null;
}
