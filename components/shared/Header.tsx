import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { Button } from "../ui/button"
import NavWrapper from "./NavWrapper"; // Import the new NavWrapper
import MobileNav from "./MobileNav"

const Header = () => {
  return (
    <header className="w-full border-b">
      <div className="wrapper flex items-center justify-between">
        <Link href="/" className="w-36">
          <Image 
            src="/assets/images/logo.svg" width={64} height={24}
            alt="Namo Amituofo logo" 
          />
        </Link>

        <SignedIn>
          <nav className="md:flex-between hidden w-full max-w-xs">
            <NavWrapper /> {/* Use NavWrapper here */}
          </nav>
        </SignedIn>

        <div className="flex w-32 justify-end gap-3">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Button asChild className="rounded-full" size="lg">
              <Link href="/sign-in">
                Login 登录
              </Link>
            </Button>
          </SignedOut>
        </div>
      </div>
      
      <SignedIn>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </SignedIn>
    </header>
  )
}

export default Header