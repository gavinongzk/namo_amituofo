'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NavItems: React.FC<{ isSuperAdmin: boolean, isNormalAdmin: boolean }> = ({ isSuperAdmin, isNormalAdmin }) => {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/" className="flex flex-col items-center">
            <Image src="/assets/icons/home.png" alt="Home" width={24} height={24} />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>活动 Events</p>
        </TooltipContent>
      </Tooltip>
      {isSuperAdmin && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/events/create" className="flex flex-col items-center">
              <Image src="/assets/icons/calendar.png" alt="Create" width={24} height={24} />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>创建 Create</p>
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/profile" className="flex flex-col items-center">
            <Image src="/assets/icons/ticket.png" alt="Ticket" width={24} height={24} />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>我的 My Events</p>
        </TooltipContent>
      </Tooltip>
      {(isSuperAdmin || isNormalAdmin) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/admin/dashboard" className="flex flex-col items-center">
              <Image src="/assets/icons/admin.png" alt="Admin" width={24} height={24} />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>管理 Admin</p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
};

export default NavItems;