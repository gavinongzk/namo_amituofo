'use client';

import Link from 'next/link';
import React from 'react';
import { useUser } from '@clerk/nextjs';

interface NavItemsProps {
  isSuperAdmin: boolean;
  isNormalAdmin: boolean;
  onClose?: () => void;
  className?: string;
}

const NavItems: React.FC<NavItemsProps> = ({ isSuperAdmin, isNormalAdmin, onClose, className }) => {
  const { isSignedIn } = useUser();
  const handleClick = () => {
    if (onClose) onClose();
  };

  return (
    <ul className={`flex flex-col md:flex-row gap-4 ${className}`}>
      <li>
        <Link href="/" onClick={handleClick}>
          寺院活动 Events
        </Link>
      </li>
      <li>
        <Link href="/event-lookup" onClick={handleClick}>
          活动查询 Event Lookup
        </Link>
      </li>
      {isSignedIn ? (
        <>
          <li>
            <Link href="/profile" onClick={handleClick}>
              我的活动 My Events
            </Link>
          </li>
          {isSuperAdmin && (
            <li>
              <Link href="/events/create" onClick={handleClick}>
                创建活动 Create Event
              </Link>
            </li>
          )}
          {(isSuperAdmin || isNormalAdmin) && (
            <li>
              <Link href="/admin/dashboard" onClick={handleClick}>
                管理员系统 Admin Dashboard
              </Link>
            </li>
          )}
        </>
      ) : (
        <li>
          <Link href="/sign-in" onClick={handleClick}>
            Admin Login 管理员登录
          </Link>
        </li>
      )}
    </ul>
  );
};

export default NavItems;