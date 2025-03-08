'use client';

import Link from 'next/link';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemsProps {
  isSuperAdmin: boolean;
  isNormalAdmin: boolean;
  onClose?: () => void;
  className?: string;
}

const NavItems: React.FC<NavItemsProps> = ({ isSuperAdmin, isNormalAdmin, onClose, className }) => {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(false);
    setLoadingPath(null);
  }, [pathname]);

  const handleClick = (href: string) => {
    if (href !== pathname) {
      setIsLoading(true);
      setLoadingPath(href);
    }
    if (onClose) onClose();
  };

  const navItemClass = (href: string) => {
    const isActive = pathname === href || (href === '/' && pathname === '/');
    
    return cn(
      // Base styles
      "group flex flex-col items-start justify-center w-full md:w-auto",
      "px-4 py-3 md:py-2",
      "rounded-lg md:rounded-md",
      "transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-primary-500",
      "relative",
      
      // Active state
      isActive && [
        "bg-primary-50/80 text-primary-700",
        "border-b-2 border-primary-600",
        "shadow-sm"
      ],
      
      // Inactive state
      !isActive && [
        "text-gray-700",
        "hover:bg-gray-50 active:bg-gray-100",
        "hover:text-primary-600"
      ]
    );
  };

  const renderLoadingSpinner = (href: string) => {
    if (isLoading && loadingPath === href) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
        </div>
      );
    }
    return null;
  };

  return (
    <ul 
      className={cn(
        "flex flex-col md:flex-row md:items-center",
        "gap-2 md:gap-1",
        className
      )}
      role="menubar"
    >
      <li role="none">
        <Link 
          href="/" 
          className={navItemClass('/')} 
          onClick={() => handleClick('/')}
          role="menuitem"
        >
          <span className="font-medium leading-none mb-1">净土宗活动</span>
          <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">Events</span>
          {renderLoadingSpinner('/')}
        </Link>
      </li>
      
      {!isSuperAdmin && !isNormalAdmin && (
        <li role="none">
          <Link 
            href="/event-lookup" 
            className={navItemClass('/event-lookup')} 
            onClick={() => handleClick('/event-lookup')}
            role="menuitem"
          >
            <span className="font-medium leading-none mb-1">活动查询</span>
            <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">Event Lookup</span>
            {renderLoadingSpinner('/event-lookup')}
          </Link>
        </li>
      )}
      
      {isSignedIn ? (
        <>
          <li role="none">
            <Link 
              href="/profile" 
              className={navItemClass('/profile')} 
              onClick={() => handleClick('/profile')}
              role="menuitem"
            >
              <span className="font-medium leading-none mb-1">我的活动</span>
              <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">My Events</span>
              {renderLoadingSpinner('/profile')}
            </Link>
          </li>
          
          {isSuperAdmin && (
            <li role="none">
              <Link 
                href="/events/create" 
                className={navItemClass('/events/create')} 
                onClick={() => handleClick('/events/create')}
                role="menuitem"
              >
                <span className="font-medium leading-none mb-1">创建活动</span>
                <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">Create Event</span>
                {renderLoadingSpinner('/events/create')}
              </Link>
            </li>
          )}
          
          <li role="none">
            <Link 
              href="/faq" 
              className={navItemClass('/faq')} 
              onClick={() => handleClick('/faq')}
              role="menuitem"
            >
              <span className="font-medium leading-none mb-1">常见问题</span>
              <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">FAQ</span>
              {renderLoadingSpinner('/faq')}
            </Link>
          </li>
          
          {(isSuperAdmin || isNormalAdmin) && (
            <li role="none">
              <Link 
                href="/admin/dashboard" 
                className={navItemClass('/admin/dashboard')} 
                onClick={() => handleClick('/admin/dashboard')}
                role="menuitem"
              >
                <span className="font-medium leading-none mb-1">管理员系统</span>
                <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">Admin Dashboard</span>
                {renderLoadingSpinner('/admin/dashboard')}
              </Link>
            </li>
          )}
        </>
      ) : (
        <li role="none">
          <Link 
            href="/faq" 
            className={navItemClass('/faq')} 
            onClick={() => handleClick('/faq')}
            role="menuitem"
          >
            <span className="font-medium leading-none mb-1">常见问题</span>
            <span className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">FAQ</span>
            {renderLoadingSpinner('/faq')}
          </Link>
        </li>
      )}
    </ul>
  );
}

export default NavItems;