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
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-md md:hidden">
      <div className="flex justify-around items-center py-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="align-middle">
            <Image 
              src="/assets/icons/menu.svg"
              alt="menu"
              width={24}
              height={24}
              className="cursor-pointer"
            />
          </SheetTrigger>
          <SheetContent className="flex flex-col gap-6 bg-white md:hidden">
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
    </nav>
  )
}

export default MobileNav