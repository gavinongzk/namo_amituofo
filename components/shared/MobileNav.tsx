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
        <SheetContent className="flex flex-col gap-6 bg-white md:hidden">
          <Image 
            src="/assets/images/logo.svg"
            alt="logo"
            width={128}
            height={38}
            className="mx-auto mt-4"
          />
          <Separator className="border border-gray-200" />
          <NavWrapper onClose={handleClose} />
        </SheetContent>
      </Sheet>
    </nav>
  )
}

export default MobileNav