'use client'; // Ensure this is a client component

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"
import { Separator } from "../ui/separator"
import NavWrapper from "./NavWrapper"
import React, { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

const AdminLoginButton = () => (
  <Link 
    href="/sign-in" 
    className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-300"
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
      <span className="font-medium">管理员登录</span>
      <span className="text-xs">Admin Login</span>
    </div>
  </Link>
)

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  return (
    <nav className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger className="align-middle">
          <div className="p-2 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors duration-200">
            <Image 
              src="/assets/icons/menu.svg"
              alt="menu"
              width={28}
              height={28}
              className="cursor-pointer transition-opacity hover:opacity-75"
            />
          </div>
        </SheetTrigger>
        <SheetContent className="flex flex-col bg-white md:hidden">
          <div className="flex-1 flex flex-col gap-6">
            <Image 
              src="/assets/images/logo.svg"
              alt="logo"
              width={96}
              height={28}
              className="mx-auto mt-4 w-24 md:w-32 h-auto"
            />
            <Separator className="border border-gray-200" />
            <NavWrapper onClose={handleClose} />
          </div>
          
          <SignedOut>
            <div className="mt-auto pt-6">
              <Separator className="border border-gray-200" />
              <div className="mt-6">
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