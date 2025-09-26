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

  // Define all possible nav items
  const navItems = [
    {
      href: '/',
      title: '净土宗活动',
      subtitle: 'Events',
      alwaysShow: true,
    },
    {
      href: '/event-lookup',
      title: '活动查询',
      subtitle: 'Event Lookup',
      alwaysShow: true,
    },
    {
      href: '/faq',
      title: '常见问题',
      subtitle: 'FAQ',
      alwaysShow: true,
    },
    {
      href: '/volunteer-recruitment',
      title: '义工招募',
      subtitle: 'Volunteer Recruitment',
      alwaysShow: true,
    },
    {
      href: '/clapping-exercise-volunteer',
      title: '拍手念佛健身操义工',
      subtitle: 'Clapping Exercise Volunteer',
      alwaysShow: true,
    },
    {
      href: '/admin/dashboard',
      title: '管理员系统',
      subtitle: 'Admin Dashboard',
      showWhen: isSignedIn && (isSuperAdmin || isNormalAdmin),
    },
  ];

  return (
    <ul 
      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full md:w-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {navItems.map((item) => (
        <li 
          key={item.href} 
          className={`w-full md:w-auto ${(!item.alwaysShow && !item.showWhen) ? 'hidden' : ''}`}
        >
          <Link 
            href={item.href} 
            className={navItemClass(item.href)} 
            onClick={() => handleClick(item.href)}
          >
            <span className="font-medium group-hover:text-primary-600 transition-colors">{item.title}</span>
            <span className="text-xs mt-0.5 text-gray-500 group-hover:text-primary-500 transition-colors">{item.subtitle}</span>
            {renderLoadingSpinner(item.href)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default NavItems;