"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { 
  ChevronUp, 
  ChevronDown, 
  ArrowUp,
  ArrowDown,
  SkipBack,
  SkipForward
} from 'lucide-react';

interface FloatingActionButtonsProps {
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  
  // Custom actions
  onScrollToTop?: () => void;
  onScrollToBottom?: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  
  // Configuration
  showPagination?: boolean;
  showScrollButtons?: boolean;
  autoHide?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onScrollToTop,
  onScrollToBottom,
  onPreviousPage,
  onNextPage,
  showPagination = true,
  showScrollButtons = true,
  autoHide = true,
  position = 'bottom-right',
  size = 'md',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(!autoHide);
  const [isExpanded, setIsExpanded] = useState(false);

  // Show/hide based on scroll position
  useEffect(() => {
    if (!autoHide) return;

    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [autoHide]);

  // Default scroll functions
  const defaultScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const defaultScrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const defaultOnPreviousPage = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
      setTimeout(onScrollToTop || defaultScrollToTop, 100);
    }
  };

  const defaultOnNextPage = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
      setTimeout(onScrollToTop || defaultScrollToTop, 100);
    }
  };

  // Position classes
  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (position) {
      case 'top-left':
        return `${base} top-4 left-4`;
      case 'top-right':
        return `${base} top-4 right-4`;
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      case 'bottom-right':
      default:
        return `${base} bottom-4 right-4`;
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      case 'md':
      default:
        return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-6 w-6';
      case 'md':
      default:
        return 'h-4 w-4';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <div className="flex flex-col items-end gap-2">
        {/* Expanded Options */}
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
            {/* Pagination Controls */}
            {showPagination && totalPages > 1 && (
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-2 shadow-lg">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onPreviousPage || defaultOnPreviousPage}
                    disabled={currentPage === 1}
                    className={`${getSizeClasses()} p-0 hover:bg-gray-100`}
                    title="Previous page"
                  >
                    <SkipBack className={getIconSize()} />
                  </Button>
                  
                  <div className="px-2 py-1 text-xs font-medium bg-gray-50 rounded min-w-[50px] text-center">
                    {currentPage}/{totalPages}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onNextPage || defaultOnNextPage}
                    disabled={currentPage === totalPages}
                    className={`${getSizeClasses()} p-0 hover:bg-gray-100`}
                    title="Next page"
                  >
                    <SkipForward className={getIconSize()} />
                  </Button>
                </div>
              </div>
            )}

            {/* Scroll Controls */}
            {showScrollButtons && (
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-2 shadow-lg">
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onScrollToTop || defaultScrollToTop}
                    className={`${getSizeClasses()} p-0 hover:bg-gray-100`}
                    title="Scroll to top"
                  >
                    <ArrowUp className={getIconSize()} />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onScrollToBottom || defaultScrollToBottom}
                    className={`${getSizeClasses()} p-0 hover:bg-gray-100`}
                    title="Scroll to bottom"
                  >
                    <ArrowDown className={getIconSize()} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Toggle Button */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`${getSizeClasses()} rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-0 transition-all duration-200 ${
            isExpanded ? 'rotate-45' : 'rotate-0'
          }`}
          title={isExpanded ? 'Close navigation' : 'Open navigation'}
        >
          {isExpanded ? (
            <ChevronDown className={getIconSize()} />
          ) : (
            <ChevronUp className={getIconSize()} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default FloatingActionButtons; 