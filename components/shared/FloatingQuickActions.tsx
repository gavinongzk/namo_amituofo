'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  Plus, 
  Search, 
  Home, 
  Menu,
  X,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const FloatingQuickActions = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'super_admin';

  // Show floating actions when user scrolls down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Close expanded menu when route changes
  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  const quickActions: QuickAction[] = [
    {
      label: '首页',
      href: '/',
      icon: <Home className="h-5 w-5" />
    },
    {
      label: '活动查询',
      href: '/event-lookup',
      icon: <Search className="h-5 w-5" />
    },
    {
      label: '创建活动',
      href: '/events/create',
      icon: <Plus className="h-5 w-5" />,
      adminOnly: true
    },
    {
      label: '活动管理',
      href: '/admin/dashboard',
      icon: <Calendar className="h-5 w-5" />,
      adminOnly: true
    },
    {
      label: '用户管理',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      adminOnly: true
    },
    {
      label: '数据分析',
      href: '/admin/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      adminOnly: true
    }
  ];

  const visibleActions = quickActions.filter(action => 
    !action.adminOnly || (isSignedIn && isAdmin)
  );

  if (!isVisible || visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="mb-4 space-y-2">
          {visibleActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button
                size="sm"
                className="w-full justify-start bg-white shadow-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => setIsExpanded(false)}
              >
                <span className="mr-2 text-gray-600">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      )}

      {/* Main Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        size="lg"
        className={`
          w-14 h-14 rounded-full shadow-lg border-0 transition-all duration-300
          ${isExpanded 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-primary-600 hover:bg-primary-700'
          }
        `}
        title={isExpanded ? '关闭菜单' : '快速操作'}
      >
        {isExpanded ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  );
};

export default FloatingQuickActions;
