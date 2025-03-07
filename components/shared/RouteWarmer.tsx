'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { preloadEvents } from '@/lib/actions/preload';
import dynamic from 'next/dynamic';

export function RouteWarmer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const warmRoutes = async () => {
      // Preload data and components based on current route
      if (pathname === '/') {
        // Preload events list data
        router.prefetch('/events');
        // Dynamically import event components
        const EventList = dynamic(() => import('@/components/shared/EventList'));
        await preloadEvents('Singapore');
      } 
      else if (pathname.startsWith('/events/')) {
        // Preload registration form if on event details
        if (!pathname.includes('/register') && !pathname.includes('/create')) {
          const RegisterFormWrapper = dynamic(() => 
            import('@/components/shared/RegisterFormWrapper')
          );
          router.prefetch(`${pathname}/register`);
        }
      }
    };
    
    warmRoutes();
  }, [pathname, router]);

  return null;
}
