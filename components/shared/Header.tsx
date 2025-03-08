'use client'

import { useCallback, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import NavWrapper from "./NavWrapper"
import MobileNav from "./MobileNav"
import CountrySelector from '@/components/shared/CountrySelector';
import { Loader2 } from 'lucide-react';

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
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  // Optimized navigation handler
  const handleNavigation = useCallback((path: string) => {
    if (path !== pathname) {
      setIsLoading(true);
      router.push(path, { scroll: false });
    }
  }, [router, pathname]);

  return (
    <header className="w-full border-b bg-white shadow-sm">
      <nav className="wrapper flex items-center justify-between py-2 sm:py-3 md:py-4">
        <button 
          onClick={() => handleNavigation('/')}
          className="transition-transform hover:scale-105 relative"
          disabled={isLoading}
        >
          <Image 
            src="/assets/images/logo.svg" 
            width={180}
            height={54}
            alt="Logo"
            priority
            className={`h-8 sm:h-10 md:h-12 lg:h-16 w-auto transition-opacity duration-300 ${isLoading ? 'opacity-60' : ''}`}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary-500" />
            </div>
          )}
        </button>

        <nav className="md:flex-between hidden w-full max-w-xl mx-4 lg:mx-8">
          <NavWrapper />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          <SignedIn>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              <CountrySelector />
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
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