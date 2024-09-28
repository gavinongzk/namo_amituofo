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
    `flex flex-col items-center justify-center px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
      pathname === href
        ? 'bg-primary-100 text-primary-600'
        : 'hover:bg-gray-100'
    }`;

  return (
    <ul className={`flex flex-col md:flex-row gap-2 ${className}`}>
      <li>
        <Link href="/" className={navItemClass('/')} onClick={handleClick}>
          <span className="font-medium">寺院活动</span>
          <span className="text-xs">Events</span>
        </Link>
      </li>
      {!isSuperAdmin && !isNormalAdmin && (
        <li>
          <Link href="/event-lookup" className={navItemClass('/event-lookup')} onClick={handleClick}>
            <span className="font-medium">活动查询</span>
            <span className="text-xs">Event Lookup</span>
          </Link>
        </li>
      )}
      {isSignedIn ? (
        <>
          <li>
            <Link href="/profile" className={navItemClass('/profile')} onClick={handleClick}>
              <span className="font-medium">我的活动</span>
              <span className="text-xs">My Events</span>
            </Link>
          </li>
          {isSuperAdmin && (
            <li>
              <Link href="/events/create" className={navItemClass('/events/create')} onClick={handleClick}>
                <span className="font-medium">创建活动</span>
                <span className="text-xs">Create Event</span>
              </Link>
            </li>
          )}
          {(isSuperAdmin || isNormalAdmin) && (
            <li>
              <Link href="/admin/dashboard" className={navItemClass('/admin/dashboard')} onClick={handleClick}>
                <span className="font-medium">管理员系统</span>
                <span className="text-xs">Admin Dashboard</span>
              </Link>
            </li>
          )}
        </>
      ) : (
        <li>
          <Link href="/sign-in" className={navItemClass('/sign-in')} onClick={handleClick}>
            <span className="font-medium">管理员登录</span>
            <span className="text-xs">Admin Login</span>
          </Link>
        </li>
      )}
    </ul>
  );
}

export default NavItems;