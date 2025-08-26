'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackToTopButtonProps {
  threshold?: number;
  className?: string;
  showText?: boolean;
}

const BackToTopButton = ({ 
  threshold = 300, 
  className = '',
  showText = false 
}: BackToTopButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50 
        bg-primary-600 hover:bg-primary-700 
        text-white shadow-lg 
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        ${showText ? 'px-4 py-2' : 'w-12 h-12 p-0 rounded-full'}
        ${className}
      `}
      title="回到顶部"
    >
      <ArrowUp className="h-5 w-5" />
      {showText && <span className="ml-2 text-sm font-medium">回到顶部</span>}
    </Button>
  );
};

export default BackToTopButton;
