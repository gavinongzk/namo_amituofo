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
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminLoginButton = () => (
  <Link 
    href="/sign-in" 
    className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-white transition-colors duration-200">
      <Image 
        src="/assets/icons/admin.png"
        width={24}
        height={24}
        alt=""
        className="object-contain w-6 h-6"
      />
    </div>
    <div className="flex flex-col">
      <span className="font-medium leading-none mb-1">管理员登录</span>
      <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-200">Admin Login</span>
    </div>
  </Link>
)

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClose = () => setIsOpen(false);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (!isMounted) return;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMounted]);

  return (
    <nav className="md:hidden" aria-label="Mobile navigation">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger 
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            "bg-gray-50 hover:bg-gray-100 active:bg-gray-200",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary-500"
          )}
          aria-label="Open menu"
        >
          <Menu 
            className={cn(
              "w-5 h-5 text-gray-700 transition-transform duration-200",
              isOpen && "transform rotate-90"
            )} 
          />
        </SheetTrigger>
        <SheetContent 
          className="flex flex-col bg-white md:hidden border-l"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex-1 flex flex-col gap-6 min-h-0">
            <Link 
              href="/"
              onClick={handleClose}
              className="mx-auto mt-4 focus:outline-none group"
            >
              <Image 
                src="/assets/images/logo.svg"
                alt="Return to homepage"
                width={96}
                height={28}
                className="w-28 md:w-32 h-auto transition-transform duration-200 group-hover:scale-105"
                priority
              />
            </Link>
            <Separator className="border-gray-200" />
            <div className="flex-1 overflow-y-auto">
              <NavWrapper onClose={handleClose} />
            </div>
          </div>
          
          <SignedOut>
            <div className="mt-auto pt-4">
              <Separator className="border-gray-200" />
              <div className="mt-4 pb-safe">
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