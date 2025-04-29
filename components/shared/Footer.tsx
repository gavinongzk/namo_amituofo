import Image from "next/image"
import Link from "next/link"

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="flex-center wrapper flex-between flex flex-col gap-4 p-5 text-center sm:flex-row">
        <Link href='/'>
          <Image 
            src="/assets/images/logo.svg"
            alt="logo"
            width={64}
            height={24}
          />
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Link href="/privacy-policy" className="text-sm hover:underline">
            Privacy Policy
          </Link>
          <p>© {new Date().getFullYear()} 净土宗弥陀寺 (新加坡) Namo Amituofo Organization Ltd. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer