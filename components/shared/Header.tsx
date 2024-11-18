'use client'

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  // Optimized navigation handler
  const handleNavigation = useCallback((path: string) => {
    router.push(path, { scroll: false });
  }, [router]);

  return (
    <header className="w-full border-b bg-white shadow-sm">
      <nav className="wrapper flex items-center justify-between py-2">
        <button 
          onClick={() => handleNavigation('/')}
          className="transition-transform hover:scale-105"
        >
          <Image 
            src="/assets/images/logo.svg" 
            width={96}
            height={28}
            alt="Logo"
            priority
          />
        </button>

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
      </nav>
    </header>
  )
}

export default Header