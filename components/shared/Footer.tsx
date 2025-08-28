'use client';

import Image from "next/image"
import Link from "next/link"

const Footer = () => {
  const currentYear = new Date().getFullYear();



  return (
    <footer className="border-t bg-gray-50">
      <div className="wrapper py-8">
        {/* Main Footer Content */}
        <div className="flex justify-center mb-8">
          {/* Logo */}
          <div>
            <Link href="/" className="inline-block">
              <Image 
                src="/assets/images/logo.svg"
                alt="logo"
                width={120}
                height={36}
                className="h-8 w-auto"
              />
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>© {currentYear} 净土宗弥陀寺 (新加坡)</span>
              <span>•</span>
              <span>Namo Amituofo Organization Ltd.</span>
              <span>•</span>
              <span>All Rights Reserved.</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/privacy-policy" 
                className="text-sm text-gray-600 hover:text-primary-600 hover:underline transition-colors"
              >
                隐私政策
              </Link>
              <Link 
                href="/faq" 
                className="text-sm text-gray-600 hover:text-primary-600 hover:underline transition-colors"
              >
                常见问题
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer