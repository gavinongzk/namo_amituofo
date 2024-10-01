import { SignedIn, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import NavWrapper from "./NavWrapper"
import MobileNav from "./MobileNav"

const Header = () => {
  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="wrapper flex items-center justify-between py-4 px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="transition-transform hover:scale-105">
            <Image 
              src="/assets/images/logo.svg" width={64} height={24}
              alt="Namo Amituofo logo" 
              className="object-contain"
            />
          </Link>
          <nav className="hidden md:block">
            <NavWrapper />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10"
                }
              }}
            />
          </SignedIn>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

export default Header