'use client'; // Ensure this is a client component

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"
import { Separator } from "../ui/separator"
import NavWrapper from "./NavWrapper"
import React, { useState, useEffect } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from 'next/navigation';

const AdminLoginButton = () => (
  <Link 
    href="/sign-in" 
    className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-all duration-300"
    onClick={(e) => e.stopPropagation()}
  >
    <Image 
      src="/assets/icons/admin.png"
      width={24}
      height={24}
      alt="Admin login"
      className="object-contain"
    />
    <div className="flex flex-col">
      <span className="font-medium text-sm">管理员登录</span>
      <span className="text-xs text-gray-500">Admin Login</span>
    </div>
  </Link>
)

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile nav when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleClose = () => setIsOpen(false);

  return (
    <nav className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger className="align-middle focus:outline-none">
          <div className="flex items-center gap-2 p-2 rounded-full bg-primary-50 hover:bg-primary-100 active:bg-primary-200 transition-all duration-200 touch-manipulation">
            <Image 
              src="/assets/icons/menu.svg"
              alt="menu"
              width={24}
              height={24}
              className="cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            />
            <span className="mr-1 text-sm font-medium text-primary-600">目录</span>
          </div>
        </SheetTrigger>
        <SheetContent 
          className="flex flex-col bg-white md:hidden w-[85vw] max-w-[400px] border-l shadow-lg"
          side="right"
        >
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-center py-4">
              <Image 
                src="/assets/images/logo.svg"
                alt="logo"
                width={128}
                height={38}
                className="w-32 h-auto transition-opacity hover:opacity-80"
              />
            </div>
            <Separator className="border border-gray-100" />
            <div className="flex-1 overflow-y-auto">
              <NavWrapper onClose={handleClose} />
            </div>
          </div>
          
          <SignedOut>
            <div className="mt-auto pt-4">
              <Separator className="border border-gray-100" />
              <div className="mt-4">
                <AdminLoginButton />
              </div>
            </div>
          </SignedOut>
        </SheetContent>
      </Sheet>
    </nav>
  )
}

export default MobileNav