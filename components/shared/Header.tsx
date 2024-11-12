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
      className="object-contain"
    />
  </Link>
)

const Header = () => {
  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="wrapper flex items-center justify-between py-4 px-4 md:px-8">
        <Link href="/" className="w-36 transition-transform hover:scale-105">
          <Image 
            src="/assets/images/logo.svg" 
            width={128} 
            height={38}
            alt="Namo Amituofo logo" 
            className="object-contain"
          />
        </Link>

        <nav className="md:flex-between hidden w-full max-w-2xl mx-8">
          <NavWrapper />
        </nav>

        <div className="flex items-center gap-4">
          <SignedIn>
            <div className="flex items-center gap-4">
              <CountrySelector />
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10"
                  }
                }}
              />
            </div>
          </SignedIn>
          <SignedOut>
            <CountrySelector />
            <AdminLoginButton />
          </SignedOut>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

export default Header