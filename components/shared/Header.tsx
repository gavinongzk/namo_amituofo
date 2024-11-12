'use client'

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import NavWrapper from "./NavWrapper"
import MobileNav from "./MobileNav"
import CountrySelector from '@/components/shared/CountrySelector';

const AdminLoginButton = () => (
  <Link 
    href="/sign-in" 
    className="transition-transform hover:scale-105"
  >
    <Image 
      src="/assets/icons/admin.png"
      width={32}
      height={32}
      alt="Admin login"
      className="object-contain md:w-[36px] md:h-[36px]"
    />
  </Link>
)

const Header = () => {
  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="wrapper flex items-center justify-between py-2 px-4 md:px-6">
        <Link href="/" className="w-24 md:w-32 transition-transform hover:scale-105">
          <Image 
            src="/assets/images/logo.svg" 
            width={96}
            height={28}
            alt="Namo Amituofo logo" 
            className="object-contain w-full h-auto"
          />
        </Link>

        <nav className="md:flex-between hidden w-full max-w-xl mx-6">
          <NavWrapper />
        </nav>

        <div className="flex items-center gap-3">
          <SignedIn>
            <div className="flex items-center gap-3">
              <CountrySelector />
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </div>
          </SignedIn>
          <SignedOut>
            <CountrySelector />
            <div className="hidden md:block">
              <AdminLoginButton />
            </div>
          </SignedOut>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

export default Header