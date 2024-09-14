import Link from "next/link"
import Image from "next/image"
import NavItems from "./NavItems"
import { useUser } from "@clerk/nextjs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const MobileNav = () => {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';
  const isNormalAdmin = user?.publicMetadata.role === 'admin';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-md md:hidden">
      <div className="flex justify-around items-center py-2">
        <TooltipProvider>
          <NavItems isSuperAdmin={isSuperAdmin} isNormalAdmin={isNormalAdmin} />
        </TooltipProvider>
      </div>
    </nav>
  )
}

export default MobileNav