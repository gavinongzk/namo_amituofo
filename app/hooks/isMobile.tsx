import { useState, useEffect } from 'react';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = (
        window.navigator.maxTouchPoints > 0 &&
        window.matchMedia("(max-width: 768px)").matches &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0)
      );
      setIsMobile(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}
