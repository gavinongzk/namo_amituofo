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
    <ul className={`flex gap-4 ${className}`}>
      <li>
        <Link href="/" onClick={onItemClick}>寺院活动 Events</Link>
      </li>
      {isSuperAdmin && (
        <li>
          <Link href="/events/create" onClick={onItemClick}>创建活动 Create Event</Link>
        </li>
      )}
      <li>
        <Link href="/profile" onClick={onItemClick}>我的活动 My Events</Link>
      </li>
      {(isSuperAdmin || isNormalAdmin) && (
        <li>
          <Link href="/admin/dashboard" onClick={onItemClick}>管理员系统 Admin Dashboard</Link>
        </li>
      )}
    </ul>
  );
};

export default NavItems;