'use client';

import Link from 'next/link';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const navItemClass = (href: string) => 
    `flex flex-col items-start justify-center px-4 py-2 text-sm rounded-md transition-all duration-300 ${
      (pathname === href || (href === '/' && pathname === '/'))
        ? 'bg-primary-50 text-primary-600 font-semibold border-b-2 border-primary-600 shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-primary-500'
    }`;

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <motion.li
      variants={item}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href={href} className={navItemClass(href)} onClick={handleClick}>
        {children}
      </Link>
    </motion.li>
  );

  return (
    <motion.ul 
      variants={container}
      initial="hidden"
      animate="show"
      className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${className}`}
    >
      <NavLink href="/">
        <span className="font-medium">寺院活动</span>
        <span className="text-xs mt-1">Events</span>
      </NavLink>

      {!isSuperAdmin && !isNormalAdmin && (
        <NavLink href="/event-lookup">
          <span className="font-medium">活动查询</span>
          <span className="text-xs mt-1">Event Lookup</span>
        </NavLink>
      )}

      {isSignedIn ? (
        <>
          <NavLink href="/profile">
            <span className="font-medium">我的活动</span>
            <span className="text-xs mt-1">My Events</span>
          </NavLink>

          {isSuperAdmin && (
            <NavLink href="/events/create">
              <span className="font-medium">创建活动</span>
              <span className="text-xs mt-1">Create Event</span>
            </NavLink>
          )}

          <NavLink href="/faq">
            <span className="font-medium">常见问题</span>
            <span className="text-xs mt-1">FAQ</span>
          </NavLink>

          {(isSuperAdmin || isNormalAdmin) && (
            <NavLink href="/admin/dashboard">
              <span className="font-medium">管理员系统</span>
              <span className="text-xs mt-1">Admin Dashboard</span>
            </NavLink>
          )}
        </>
      ) : (
        <NavLink href="/faq">
          <span className="font-medium">常见问题</span>
          <span className="text-xs mt-1">FAQ</span>
        </NavLink>
      )}
    </motion.ul>
  );
}

export default NavItems;