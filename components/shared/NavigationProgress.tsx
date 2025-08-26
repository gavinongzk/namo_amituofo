'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const NavigationProgress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);
      
      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 100);
    };

    const completeLoading = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    };

    // Start loading when pathname changes
    startLoading();

    // Complete loading after a short delay
    const completeTimeout = setTimeout(completeLoading, 300);

    return () => {
      clearTimeout(completeTimeout);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [pathname]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full z-[9999]">
      <div 
        className="h-1 bg-primary-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default NavigationProgress;
