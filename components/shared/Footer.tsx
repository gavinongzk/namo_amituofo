import Image from "next/image"
import Link from "next/link"
import { 
  Calendar, 
  Search, 
  HelpCircle, 
  Shield, 
  Home,
  Users,
  BarChart3
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "主要功能",
      links: [
        { label: "首页", href: "/", icon: <Home className="h-4 w-4" /> },
        { label: "活动查询", href: "/event-lookup", icon: <Search className="h-4 w-4" /> },
        { label: "活动管理", href: "/admin/dashboard", icon: <Calendar className="h-4 w-4" /> },
        { label: "用户管理", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
        { label: "数据分析", href: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
      ]
    },
    {
      title: "帮助与支持",
      links: [
        { label: "常见问题", href: "/faq", icon: <HelpCircle className="h-4 w-4" /> },
        { label: "隐私政策", href: "/privacy-policy", icon: <Shield className="h-4 w-4" /> },
      ]
    }
  ];

  return (
    <footer className="border-t bg-gray-50">
      <div className="wrapper py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image 
                src="/assets/images/logo.svg"
                alt="logo"
                width={120}
                height={36}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed">
              净土宗弥陀寺 (新加坡) 致力于为信众提供优质的活动管理服务，让佛法活动更加便捷高效。
            </p>
          </div>

          {/* Navigation Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      href={link.href}
                      className="flex items-center text-gray-600 hover:text-primary-600 transition-colors duration-200 text-sm group"
                    >
                      <span className="mr-2 text-gray-400 group-hover:text-primary-500 transition-colors">
                        {link.icon}
                      </span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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