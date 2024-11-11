'use client';

import Link from 'next/link';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

interface NavItemsProps {
  isSuperAdmin: boolean;
  isNormalAdmin: boolean;
  onClose?: () => void;
  className?: string;
}

const NavItems: React.FC<NavItemsProps> = ({ isSuperAdmin, isNormalAdmin, onClose, className }) => {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  const handleClick = () => {
    if (onClose) onClose();
  };

  const navItemClass = (href: string) => 
    `flex flex-col items-start justify-center px-4 py-2 text-sm rounded-md transition-all duration-300 ${
      (pathname === href || (href === '/' && pathname === '/'))
        ? 'bg-primary-50 text-primary-600 font-semibold border-b-2 border-primary-600 shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-primary-500'
    }`;

  return (
    <ul className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${className}`}>
      <li>
        <Link href="/" className={navItemClass('/')} onClick={handleClick}>
          <span className="font-medium">寺院活动</span>
          <span className="text-xs mt-1">Events</span>
        </Link>
      </li>
      {!isSuperAdmin && !isNormalAdmin && (
        <li>
          <Link href="/event-lookup" className={navItemClass('/event-lookup')} onClick={handleClick}>
            <span className="font-medium">活动查询</span>
            <span className="text-xs mt-1">Event Lookup</span>
          </Link>
        </li>
      )}
      {isSignedIn ? (
        <>
          <li>
            <Link href="/profile" className={navItemClass('/profile')} onClick={handleClick}>
              <span className="font-medium">我的活动</span>
              <span className="text-xs mt-1">My Events</span>
            </Link>
          </li>
          {isSuperAdmin && (
            <li>
              <Link href="/events/create" className={navItemClass('/events/create')} onClick={handleClick}>
                <span className="font-medium">创建活动</span>
                <span className="text-xs mt-1">Create Event</span>
              </Link>
            </li>
          )}
      <li>
        <Link href="/faq" className={navItemClass('/faq')} onClick={handleClick}>
          <span className="font-medium">常见问题</span>
          <span className="text-xs mt-1">FAQ</span>
        </Link>
      </li>
          {(isSuperAdmin || isNormalAdmin) && (
            <li>
              <Link href="/admin/dashboard" className={navItemClass('/admin/dashboard')} onClick={handleClick}>
                <span className="font-medium">管理员系统</span>
                <span className="text-xs mt-1">Admin Dashboard</span>
              </Link>
            </li>
          )}
        </>
      ) : (
        <li>
          <Link href="/sign-in" className={navItemClass('/sign-in')} onClick={handleClick}>
            <span className="font-medium">管理员登录</span>
            <span className="text-xs mt-1">Admin Login</span>
          </Link>
        </li>
      )}
    </ul>
  );
}

export default NavItems;