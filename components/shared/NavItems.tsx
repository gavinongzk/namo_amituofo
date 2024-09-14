'use client';

import { headerLinks } from '@/constants';
import Link from 'next/link';
import React from 'react';

const NavItems: React.FC<{ isSuperAdmin: boolean, isNormalAdmin: boolean }> = ({ isSuperAdmin, isNormalAdmin }) => {
  return (
    <ul className="flex gap-4">
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