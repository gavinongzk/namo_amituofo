'use client';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"
import { Separator } from "../ui/separator"
import NavWrapper from "./NavWrapper"

const MobileNav = ({ isSuperAdmin, isNormalAdmin }: { isSuperAdmin: boolean; isNormalAdmin: boolean }) => {
  return (
    <Sheet>
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
        <NavWrapper isSuperAdmin={isSuperAdmin} isNormalAdmin={isNormalAdmin} />
      </SheetContent>
    </Sheet>
  )
}

export default MobileNav