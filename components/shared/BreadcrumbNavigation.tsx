'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

const BreadcrumbNavigation = () => {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: '首页', href: '/', isCurrent: segments.length === 0 }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Map segment to readable label
      const label = getSegmentLabel(segment, segments, index);
      
      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrent: index === segments.length - 1
      });
    });

    return breadcrumbs;
  };

  const getSegmentLabel = (segment: string, segments: string[], index: number): string => {
    const labelMap: Record<string, string> = {
      'admin': '管理员系统',
      'dashboard': '仪表板',
      'analytics': '数据分析',
      'attendance': '出席管理',
      'users': '用户管理',
      'events': '活动管理',
      'create': '创建',
      'details': '详情',
      'update': '更新',
      'register': '注册',
      'event-lookup': '活动查询',
      'faq': '常见问题',
      'profile': '个人资料',
      'privacy-policy': '隐私政策',
      'reg': '注册',
      'upload_orders': '上传订单',
      'select-event': '选择活动'
    };

    return labelMap[segment] || segment;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4 px-4 py-2 bg-gray-50 rounded-lg">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
          )}
          
          {item.isCurrent ? (
            <span className="font-medium text-gray-900 truncate max-w-[200px]">
              {index === 0 ? (
                <Home className="h-4 w-4 inline mr-1" />
              ) : null}
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-primary-600 hover:underline transition-colors duration-200 truncate max-w-[200px] flex items-center"
            >
              {index === 0 ? (
                <Home className="h-4 w-4 mr-1" />
              ) : null}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;
