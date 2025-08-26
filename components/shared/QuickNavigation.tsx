'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QuickNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  adminOnly?: boolean;
}

const QuickNavigation = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  // Check if user is admin (you may need to adjust this based on your user roles)
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'super_admin';

  const quickNavItems: QuickNavItem[] = [
    {
      label: '创建活动',
      href: '/events/create',
      icon: <Plus className="h-5 w-5" />,
      description: '创建新的活动',
      adminOnly: true
    },
    {
      label: '活动查询',
      href: '/event-lookup',
      icon: <Search className="h-5 w-5" />,
      description: '查找和查询活动'
    },
    {
      label: '活动管理',
      href: '/admin/dashboard',
      icon: <Calendar className="h-5 w-5" />,
      description: '管理所有活动',
      adminOnly: true
    },
    {
      label: '用户管理',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      description: '管理用户账户',
      adminOnly: true
    },
    {
      label: '数据分析',
      href: '/admin/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      description: '查看统计数据',
      adminOnly: true
    },
    {
      label: '出席管理',
      href: '/admin/attendance',
      icon: <Users className="h-5 w-5" />,
      description: '管理活动出席',
      adminOnly: true
    }
  ];

  const visibleItems = quickNavItems.filter(item => 
    !item.adminOnly || (isSignedIn && isAdmin)
  );

  // Don't show if no items are visible
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">快速导航</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className={`grid gap-3 transition-all duration-300 ${
          isExpanded 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-2'
        }`}>
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center p-3 rounded-lg border border-gray-200 
                hover:border-primary-300 hover:bg-primary-50 
                transition-all duration-200
                ${pathname === item.href ? 'bg-primary-100 border-primary-400' : ''}
              `}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`
                  p-2 rounded-lg 
                  ${pathname === item.href 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600'
                  }
                  transition-colors duration-200
                `}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                    {item.label}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <Link href="/faq">
                <Button variant="outline" size="sm">
                  常见问题
                </Button>
              </Link>
              <Link href="/privacy-policy">
                <Button variant="outline" size="sm">
                  隐私政策
                </Button>
              </Link>
              {isSignedIn && (
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    个人资料
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuickNavigation;
