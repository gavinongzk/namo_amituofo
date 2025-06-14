"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface FloatingNavigationProps {
  // Pagination props
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  
  // Optional scroll target (defaults to window)
  scrollTarget?: string | HTMLElement;
  
  // Position customization
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  // Show/hide specific buttons
  showPagination?: boolean;
  showScrollButtons?: boolean;
  
  // Custom styling
  className?: string;
}

const FloatingNavigation: React.FC<FloatingNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  scrollTarget,
  position = 'top-right',
  showPagination = true,
  showScrollButtons = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show floating buttons when user scrolls down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    if (scrollTarget) {
      const element = typeof scrollTarget === 'string' 
        ? document.querySelector(scrollTarget) 
        : scrollTarget;
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollTarget) {
      const element = typeof scrollTarget === 'string' 
        ? document.querySelector(scrollTarget) 
        : scrollTarget;
      element?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setTimeout(scrollToTop, 100);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      setTimeout(scrollToTop, 100);
    }
  };

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (!isVisible && position.includes('top')) {
    return null;
  }

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-50 flex flex-col gap-2 ${className}`}
      style={{ zIndex: 1000 }}
    >
      {/* Pagination Controls */}
      {showPagination && totalPages > 1 && (
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-lg">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
              title="Previous page & scroll to top"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-xs font-medium px-2 min-w-[60px] text-center">
              {currentPage}/{totalPages}
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
              title="Next page & scroll to top"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Scroll Controls */}
      {showScrollButtons && (
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-lg">
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={scrollToTop}
              className="h-8 w-8 p-0"
              title="Scroll to top"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={scrollToBottom}
              className="h-8 w-8 p-0"
              title="Scroll to bottom"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingNavigation; 