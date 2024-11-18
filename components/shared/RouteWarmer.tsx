'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function RouteWarmer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const warmRoutes = async () => {
      if (pathname === '/') {
        router.prefetch('/events');
        router.prefetch('/faq');
      } else if (pathname.startsWith('/events/')) {
        router.prefetch('/events');
        router.prefetch('/');
        
        // If on event details, prefetch registration
        if (!pathname.includes('/register')) {
          router.prefetch(`${pathname}/register`);
        }
      }
    };
    
    warmRoutes();
  }, [pathname, router]);

  return null;
}
