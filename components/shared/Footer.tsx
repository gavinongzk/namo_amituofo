import Image from "next/image"
import Link from "next/link"

const Footer = () => {
  return (
    <footer className="border-t bg-gray-50">
      <div className="wrapper py-8 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:gap-12 md:justify-between">
          {/* Logo and Description */}
          <div className="flex flex-col gap-4 md:max-w-xs">
            <Link href='/' className="w-fit">
              <Image 
                src="/assets/images/logo.svg"
                alt="logo"
                width={64}
                height={24}
                className="object-contain"
              />
            </Link>
            <p className="text-sm text-gray-600">
              Dedicated to spreading Buddhist teachings and fostering spiritual growth in the community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-8 md:gap-12">
            <div className="flex flex-col gap-4">
              <h3 className="font-medium">Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Link href="/events" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Events</Link>
                <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About Us</Link>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <h3 className="font-medium">Contact Us</h3>
              <div className="flex flex-col gap-2">
                <a href="tel:+6500000000" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">+65 0000 0000</a>
                <a href="mailto:contact@example.com" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">contact@example.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            {new Date().getFullYear()} 净土宗弥陀寺 (新加坡) Namo Amituofo Organization Ltd. All Rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer