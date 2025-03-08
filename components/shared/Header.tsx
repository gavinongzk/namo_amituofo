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
import { cn } from '@/lib/utils';

const AdminLoginButton = () => (
  <Link 
    href="/sign-in" 
    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
    aria-label="Admin login"
  >
    <Image 
      src="/assets/icons/admin.png"
      width={32}
      height={32}
      alt=""
      className="object-contain w-8 h-8 md:w-9 md:h-9"
    />
  </Link>
)

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Optimized navigation handler
  const handleNavigation = useCallback((path: string) => {
    if (path !== pathname) {
      setIsLoading(true);
      router.push(path, { scroll: false });
    }
  }, [router, pathname]);

  return (
    <header 
      className={cn(
        "sticky top-0 w-full border-b bg-white/95 backdrop-blur-sm transition-shadow duration-300 z-50",
        isScrolled ? "shadow-md" : "shadow-sm"
      )}
      role="banner"
    >
      <nav 
        className="wrapper flex items-center justify-between py-3 px-4 md:py-4 md:px-6 lg:px-8"
        role="navigation"
        aria-label="Main navigation"
      >
        <button 
          onClick={() => handleNavigation('/')}
          className="relative flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg group"
          disabled={isLoading}
          aria-label="Go to homepage"
        >
          <Image 
            src="/assets/images/logo.svg" 
            width={180}
            height={54}
            alt="Logo"
            priority
            className={cn(
              "h-12 md:h-16 lg:h-20 w-auto transition-all duration-300",
              isLoading ? "opacity-60 scale-98" : "group-hover:scale-[1.02]"
            )}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          )}
        </button>

        <nav 
          className="md:flex-between hidden w-full max-w-xl mx-8 lg:mx-12"
          aria-label="Desktop navigation"
        >
          <NavWrapper />
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          <SignedIn>
            <div className="flex items-center gap-3 md:gap-5">
              <CountrySelector />
              <div className="relative">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-10 w-10 md:h-11 md:w-11 ring-2 ring-transparent hover:ring-primary-200 transition-all duration-200",
                      userButtonPopoverCard: "shadow-card",
                    }
                  }}
                />
              </div>
            </div>
          </SignedIn>
          <SignedOut>
            <CountrySelector />
            <div className="hidden md:block">
              <AdminLoginButton />
            </div>
          </SignedOut>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header