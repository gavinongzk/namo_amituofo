'use client';

import Link from 'next/link';
import React from 'react';

interface NavItemsProps {
  isSuperAdmin: boolean;
  isNormalAdmin: boolean;
  onItemClick?: () => void;
  className?: string;
}

const NavItems: React.FC<NavItemsProps> = ({ isSuperAdmin, isNormalAdmin, onItemClick, className }) => {
  return (
    <ul className={`flex flex-col md:flex-row gap-4 ${className}`}>
      <li>
        <Link href="/">寺院活动 Events</Link>
      </li>
      {isSuperAdmin && (
        <li>
          <Link href="/events/create">创建活动 Create Event</Link>
        </li>
      )}
      <li>
        <Link href="/profile">我的活动 My Events</Link>
      </li>
      {(isSuperAdmin || isNormalAdmin) && (
        <li>
          <Link href="/admin/dashboard">管理员系统 Admin Dashboard</Link>
        </li>
      )}
    </ul>
  );
};

export default NavItems;