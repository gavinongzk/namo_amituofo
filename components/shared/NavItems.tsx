'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

const NavItems: React.FC<{ isSuperAdmin: boolean, isNormalAdmin: boolean }> = ({ isSuperAdmin, isNormalAdmin }) => {
  return (
    <>
      <Link href="/" className="flex flex-col items-center">
        <Image src="/assets/icons/home.png" alt="Home" width={24} height={24} />
        <span className="text-xs mt-1">活动</span>
      </Link>
      {isSuperAdmin && (
        <Link href="/events/create" className="flex flex-col items-center">
          <Image src="/assets/icons/calendar.png" alt="Create" width={24} height={24} />
          <span className="text-xs mt-1">创建</span>
        </Link>
      )}
      <Link href="/profile" className="flex flex-col items-center">
        <Image src="/assets/icons/ticket.png" alt="Ticket" width={24} height={24} />
        <span className="text-xs mt-1">我的</span>
      </Link>
      {(isSuperAdmin || isNormalAdmin) && (
        <Link href="/admin/dashboard" className="flex flex-col items-center">
          <Image src="/assets/icons/admin.png" alt="Admin" width={24} height={24} />
          <span className="text-xs mt-1">管理</span>
        </Link>
      )}
    </>
  );
};

export default NavItems;