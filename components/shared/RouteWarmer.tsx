'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { preloadEvents } from '@/lib/actions/preload';
import dynamic from 'next/dynamic';

// Define common routes to prefetch
const COMMON_ROUTES = [
  '/events',
  '/profile',
  '/register',
];

// Define critical components to preload
const CRITICAL_COMPONENTS = {
  EventList: () => import('@/components/shared/EventList'),
  CategoryFilter: () => import('@/components/shared/CategoryFilter'),
  RegisterFormWrapper: () => import('@/components/shared/RegisterFormWrapper'),
};

export function RouteWarmer() {
  const router = useRouter();
  const pathname = usePathname();
  const preloadedRef = useRef({
    routes: false,
    components: false,
    events: false,
  });

  // Preload all common routes
  const warmCommonRoutes = useCallback(() => {
    if (preloadedRef.current.routes) return;
    
    try {
      COMMON_ROUTES.forEach(route => {
        router.prefetch(route);
      });
      
      preloadedRef.current.routes = true;
    } catch (error) {
      console.error('Error prefetching common routes:', error);
    }
  }, [router]);

  // Preload critical components
  const preloadCriticalComponents = useCallback(() => {
    if (preloadedRef.current.components) return;
    
    // Use a staggered approach to avoid network congestion
    Object.entries(CRITICAL_COMPONENTS).forEach(([name, importFn], index) => {
      setTimeout(() => {
        // Execute the import function but don't use dynamic directly
        // This preloads the component without rendering it
        importFn().catch(err => 
          console.error(`Failed to preload ${name}:`, err)
        );
      }, index * 200); // Stagger by 200ms
    });
    
    preloadedRef.current.components = true;
  }, []);

  const warmHomeRoute = useCallback(async () => {
    try {
      router.prefetch('/events');
      
      // Only preload events if not already done
      if (!preloadedRef.current.events) {
        // Use requestIdleCallback to preload events when browser is idle
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            void preloadEvents('Singapore').catch(err => 
              console.error('Error preloading Singapore events:', err)
            );
            
            // Stagger the second preload to avoid overwhelming the network
            setTimeout(() => {
              void preloadEvents('Malaysia').catch(err => 
                console.error('Error preloading Malaysia events:', err)
              );
            }, 1000);
          });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            void preloadEvents('Singapore').catch(err => 
              console.error('Error preloading Singapore events:', err)
            );
            
            setTimeout(() => {
              void preloadEvents('Malaysia').catch(err => 
                console.error('Error preloading Malaysia events:', err)
              );
            }, 1000);
          }, 1000);
        }
        
        preloadedRef.current.events = true;
      }
    } catch (error) {
      console.error('Error warming home route:', error);
    }
  }, [router]);

  const warmEventDetailsRoute = useCallback(async (eventId: string) => {
    try {
      const registerPath = `/events/details/${eventId}/register`;
      router.prefetch(registerPath);
      
      // Preload registration form
      dynamic(() => import('@/components/shared/RegisterFormWrapper'), { ssr: false });
    } catch (error) {
      console.error(`Error warming event details route for ${eventId}:`, error);
    }
  }, [router]);

  useEffect(() => {
    // First, warm common routes regardless of current path
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(warmCommonRoutes);
      
      // Preload critical components after a delay
      window.requestIdleCallback(() => {
        setTimeout(preloadCriticalComponents, 500);
      });
    } else {
      setTimeout(warmCommonRoutes, 1000);
      setTimeout(preloadCriticalComponents, 1500);
    }
    
    // Then, handle route-specific preloading
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
  }, [pathname, warmHomeRoute, warmEventDetailsRoute, warmCommonRoutes, preloadCriticalComponents]);

  // Use intersection observer to detect when user is about to reach the bottom of the page
  useEffect(() => {
    // Only set up the observer if we're on the events page
    if (pathname !== '/events') return;
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          try {
            // User is approaching bottom of page, prefetch next page of events
            router.prefetch('/events?page=2');
          } catch (error) {
            console.error('Error prefetching next page:', error);
          }
        }
      });
    };
    
    // Create a sentinel element to observe
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    sentinel.style.position = 'absolute';
    sentinel.style.bottom = '1000px'; // 1000px from bottom
    document.body.appendChild(sentinel);
    
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '0px 0px 1000px 0px' // Start loading when within 1000px of the sentinel
    });
    
    observer.observe(sentinel);
    
    return () => {
      observer.disconnect();
      if (document.body.contains(sentinel)) {
        document.body.removeChild(sentinel);
      }
    };
  }, [pathname, router]);

  return null;
}
