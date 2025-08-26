'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  ClipboardList,
  Upload,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

const AdminNavigation = () => {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'super_admin';

  // Only show on admin pages
  if (!pathname.startsWith('/admin') || !isSignedIn || !isAdmin) {
    return null;
  }

  const adminNavItems: AdminNavItem[] = [
    {
      label: '仪表板',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      description: '系统概览和统计'
    },
    {
      label: '活动管理',
      href: '/admin/select-event',
      icon: <Calendar className="h-5 w-5" />,
      description: '创建和管理活动'
    },
    {
      label: '用户管理',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      description: '管理用户账户'
    },
    {
      label: '出席管理',
      href: '/admin/attendance',
      icon: <ClipboardList className="h-5 w-5" />,
      description: '管理活动出席记录'
    },
    {
      label: '数据分析',
      href: '/admin/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      description: '查看详细统计数据'
    },
    {
      label: '上传订单',
      href: '/admin/upload_orders',
      icon: <Upload className="h-5 w-5" />,
      description: '批量上传订单数据'
    }
  ];

  const currentPage = adminNavItems.find(item => pathname.startsWith(item.href)) || adminNavItems[0];

  return (
    <div className="mb-6">
      <Card className="p-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">管理员系统</h2>
              <p className="text-sm text-gray-600">当前页面: {currentPage.label}</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {adminNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-start p-3 rounded-lg border transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-50 border-primary-300 shadow-sm' 
                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }
                `}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className={`
                    p-2 rounded-lg flex-shrink-0
                    ${isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600'
                    }
                    transition-colors duration-200
                  `}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`
                      font-medium transition-colors
                      ${isActive ? 'text-primary-700' : 'text-gray-900 group-hover:text-primary-700'}
                    `}>
                      {item.label}
                    </div>
                    <div className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors mt-1">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Current User Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">当前用户:</span>
              <span className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-gray-500">
                ({(user?.publicMetadata?.role as string) || 'user'})
              </span>
            </div>
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                个人设置
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminNavigation;
