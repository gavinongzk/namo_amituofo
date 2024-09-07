'use client';

import { headerLinks } from '@/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { currentUser } from '@clerk/nextjs';

const NavItems = async () => { // Declare as async
  const user = await currentUser(); // Await the Promise
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';

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