'use client';

import { headerLinks } from '@/constants';
import Link from 'next/link';
import React from 'react';

const NavItems: React.FC<{ isSuperAdmin: boolean }> = ({ isSuperAdmin }) => {
  return (
    <ul className="flex gap-4">
      <li>
        <Link href="/">Home</Link>
      </li>
      {isSuperAdmin && (
        <li>
          <Link href="/events/create">Create Event</Link>
        </li>
      )}
      <li>
        <Link href="/profile">My Profile</Link>
      </li>
      <li>
        <Link href="/admin/dashboard">Admin Dashboard</Link>
      </li>
    </ul>
  );
};

export default NavItems;