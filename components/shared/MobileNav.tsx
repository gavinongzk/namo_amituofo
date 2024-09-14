'use client';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"
import { Separator } from "../ui/separator"
import NavItems from "./NavItems"
import { useUser } from "@clerk/nextjs"
import { useState } from "react"

const MobileNav = () => {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';
  const isNormalAdmin = user?.publicMetadata.role === 'admin';
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="bg-white p-2 rounded-full shadow-md">
            <Image 
              src="/assets/icons/menu.svg"
              alt="menu"
              width={32}
              height={32}
              className="cursor-pointer"
            />
          </SheetTrigger>
          <SheetContent className="flex flex-col gap-6 bg-white">
            <Image 
              src="/assets/images/logo.svg"
              alt="logo"
              width={128}
              height={38}
            />
            <Separator className="border border-gray-50" />
            <NavItems 
              isSuperAdmin={isSuperAdmin} 
              isNormalAdmin={isNormalAdmin} 
              onItemClick={handleItemClick}
              className="flex-col items-start"
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

export default MobileNav