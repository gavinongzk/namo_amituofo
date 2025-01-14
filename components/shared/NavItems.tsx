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

  const navItemClass = (href: string) => 
    `flex flex-col items-start justify-center px-4 py-2 text-sm rounded-md transition-all duration-300 relative ${
      (pathname === href || (href === '/' && pathname === '/'))
        ? 'bg-primary-50 text-primary-600 font-semibold border-b-2 border-primary-600 shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-primary-500'
    }`;

  const renderLoadingSpinner = (href: string) => {
    if (isLoading && loadingPath === href) {
      return (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      );
    }
    return null;
  };

  return (
    <ul className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${className}`}>
      <li>
        <Link href="/" className={navItemClass('/')} onClick={() => handleClick('/')}>
          <span className="font-medium">净土宗活动</span>
          <span className="text-xs mt-1">Events</span>
          {renderLoadingSpinner('/')}
        </Link>
      </li>
      {!isSuperAdmin && !isNormalAdmin && (
        <li>
          <Link href="/event-lookup" className={navItemClass('/event-lookup')} onClick={() => handleClick('/event-lookup')}>
            <span className="font-medium">活动查询</span>
            <span className="text-xs mt-1">Event Lookup</span>
            {renderLoadingSpinner('/event-lookup')}
          </Link>
        </li>
      )}
      {isSignedIn ? (
        <>
          <li>
            <Link href="/profile" className={navItemClass('/profile')} onClick={() => handleClick('/profile')}>
              <span className="font-medium">我的活动</span>
              <span className="text-xs mt-1">My Events</span>
              {renderLoadingSpinner('/profile')}
            </Link>
          </li>
          {isSuperAdmin && (
            <li>
              <Link href="/events/create" className={navItemClass('/events/create')} onClick={() => handleClick('/events/create')}>
                <span className="font-medium">创建活动</span>
                <span className="text-xs mt-1">Create Event</span>
                {renderLoadingSpinner('/events/create')}
              </Link>
            </li>
          )}
          <li>
            <Link href="/faq" className={navItemClass('/faq')} onClick={() => handleClick('/faq')}>
              <span className="font-medium">常见问题</span>
              <span className="text-xs mt-1">FAQ</span>
              {renderLoadingSpinner('/faq')}
            </Link>
          </li>
          {(isSuperAdmin || isNormalAdmin) && (
            <li>
              <Link href="/admin/dashboard" className={navItemClass('/admin/dashboard')} onClick={() => handleClick('/admin/dashboard')}>
                <span className="font-medium">管理员系统</span>
                <span className="text-xs mt-1">Admin Dashboard</span>
                {renderLoadingSpinner('/admin/dashboard')}
              </Link>
            </li>
          )}
        </>
      ) : (
        <li>
          <Link href="/faq" className={navItemClass('/faq')} onClick={() => handleClick('/faq')}>
            <span className="font-medium">常见问题</span>
            <span className="text-xs mt-1">FAQ</span>
            {renderLoadingSpinner('/faq')}
          </Link>
        </li>
      )}
    </ul>
  );
}

export default NavItems;