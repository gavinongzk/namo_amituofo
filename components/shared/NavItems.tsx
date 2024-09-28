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
    `px-4 py-2 rounded-md transition-colors duration-200 ${
      pathname === href
        ? 'bg-primary-100 text-primary-600'
        : 'hover:bg-gray-100'
    }`;

  return (
    <ul className={`flex flex-col md:flex-row gap-2 ${className}`}>
      <li>
        <Link href="/" className={navItemClass('/')} onClick={handleClick}>
          寺院活动 Events
        </Link>
      </li>
      <li>
        <Link href="/event-lookup" className={navItemClass('/event-lookup')} onClick={handleClick}>
          活动查询 Event Lookup
        </Link>
      </li>
      {isSignedIn ? (
        <>
          <li>
            <Link href="/profile" className={navItemClass('/profile')} onClick={handleClick}>
              我的活动 My Events
            </Link>
          </li>
          {isSuperAdmin && (
            <li>
              <Link href="/events/create" className={navItemClass('/events/create')} onClick={handleClick}>
                创建活动 Create Event
              </Link>
            </li>
          )}
          {(isSuperAdmin || isNormalAdmin) && (
            <li>
              <Link href="/admin/dashboard" className={navItemClass('/admin/dashboard')} onClick={handleClick}>
                管理员系统 Admin Dashboard
              </Link>
            </li>
          )}
        </>
      ) : (
        <li>
          <Link href="/sign-in" className={navItemClass('/sign-in')} onClick={handleClick}>
            Admin Login 管理员登录
          </Link>
        </li>
      )}
    </ul>
  );
};

export default NavItems;