'use client';

import Link from 'next/link';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 150) {
      // Swipe left
      if (onClose) onClose();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  const navItemClass = (href: string) => 
    `group flex flex-col items-start justify-center p-3 md:px-4 md:py-2 text-sm rounded-lg md:rounded-md transition-all duration-300 relative w-full md:w-auto
    ${pathname === href || (href === '/' && pathname === '/')
      ? 'bg-primary-50 text-primary-600 font-medium shadow-sm'
      : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100 hover:text-primary-500'
    }`;

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
      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full md:w-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <li className="w-full md:w-auto">
        <Link href="/" className={navItemClass('/')} onClick={() => handleClick('/')}>
          <span className="font-medium group-hover:text-primary-600 transition-colors">净土宗活动</span>
          <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">Events</span>
          {renderLoadingSpinner('/')}
        </Link>
      </li>
      {!isSuperAdmin && !isNormalAdmin && (
        <li className="w-full md:w-auto">
          <Link href="/event-lookup" className={navItemClass('/event-lookup')} onClick={() => handleClick('/event-lookup')}>
            <span className="font-medium group-hover:text-primary-600 transition-colors">活动查询</span>
            <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">Event Lookup</span>
            {renderLoadingSpinner('/event-lookup')}
          </Link>
        </li>
      )}
      {isSignedIn ? (
        <>
          <li className="w-full md:w-auto">
            <Link href="/profile" className={navItemClass('/profile')} onClick={() => handleClick('/profile')}>
              <span className="font-medium group-hover:text-primary-600 transition-colors">我的活动</span>
              <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">My Events</span>
              {renderLoadingSpinner('/profile')}
            </Link>
          </li>
          {isSuperAdmin && (
            <li className="w-full md:w-auto">
              <Link href="/events/create" className={navItemClass('/events/create')} onClick={() => handleClick('/events/create')}>
                <span className="font-medium group-hover:text-primary-600 transition-colors">创建活动</span>
                <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">Create Event</span>
                {renderLoadingSpinner('/events/create')}
              </Link>
            </li>
          )}
          <li className="w-full md:w-auto">
            <Link href="/faq" className={navItemClass('/faq')} onClick={() => handleClick('/faq')}>
              <span className="font-medium group-hover:text-primary-600 transition-colors">常见问题</span>
              <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">FAQ</span>
              {renderLoadingSpinner('/faq')}
            </Link>
          </li>
          {(isSuperAdmin || isNormalAdmin) && (
            <>
              <li className="w-full md:w-auto">
                <Link href="/admin/dashboard" className={navItemClass('/admin/dashboard')} onClick={() => handleClick('/admin/dashboard')}>
                  <span className="font-medium group-hover:text-primary-600 transition-colors">管理员系统</span>
                  <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">Admin Dashboard</span>
                  {renderLoadingSpinner('/admin/dashboard')}
                </Link>
              </li>
              <li className="w-full md:w-auto">
                <Link href="/admin/event-lookup" className={navItemClass('/admin/event-lookup')} onClick={() => handleClick('/admin/event-lookup')}>
                  <span className="font-medium group-hover:text-primary-600 transition-colors">活动查询</span>
                  <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">Event Lookup</span>
                  {renderLoadingSpinner('/admin/event-lookup')}
                </Link>
              </li>
              <li className="w-full md:w-auto">
                <Link href="/admin/my-events" className={navItemClass('/admin/my-events')} onClick={() => handleClick('/admin/my-events')}>
                  <span className="font-medium group-hover:text-primary-600 transition-colors">我的活动</span>
                  <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">My Events</span>
                  {renderLoadingSpinner('/admin/my-events')}
                </Link>
              </li>
            </>
          )}
        </>
      ) : (
        <li className="w-full md:w-auto">
          <Link href="/faq" className={navItemClass('/faq')} onClick={() => handleClick('/faq')}>
            <span className="font-medium group-hover:text-primary-600 transition-colors">常见问题</span>
            <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">FAQ</span>
            {renderLoadingSpinner('/faq')}
          </Link>
        </li>
      )}
    </ul>
  );
}

export default NavItems;