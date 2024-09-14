'use client';

import Link from 'next/link';
import React from 'react';
import { SheetClose } from '@/components/ui/sheet'; // Correct import

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
        <SheetClose asChild>
          <Link href="/">寺院活动 Events</Link>
        </SheetClose>
      </li>
      {isSuperAdmin && (
        <li>
          <SheetClose asChild>
            <Link href="/events/create">创建活动 Create Event</Link>
          </SheetClose>
        </li>
      )}
      <li>
        <SheetClose asChild>
          <Link href="/profile">我的活动 My Events</Link>
        </SheetClose>
      </li>
      {(isSuperAdmin || isNormalAdmin) && (
        <li>
          <SheetClose asChild>
            <Link href="/admin/dashboard">管理员系统 Admin Dashboard</Link>
          </SheetClose>
        </li>
      )}
    </ul>
  );
};

export default NavItems;