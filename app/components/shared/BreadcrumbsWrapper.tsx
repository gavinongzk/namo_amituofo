'use client';

import { usePathname } from 'next/navigation';
import Breadcrumbs from './Breadcrumbs';

// Path translations mapping
const pathTranslations: Record<string, { en: string; zh: string }> = {
  'home': { zh: '首页', en: 'Home' },
  'events': { zh: '活动', en: 'Events' },
  'details': { zh: '详情', en: 'Details' },
  'profile': { zh: '个人资料', en: 'Profile' },
  'settings': { zh: '设置', en: 'Settings' },
  'register': { zh: '注册', en: 'Register' },
  'login': { zh: '登录', en: 'Login' },
  // Add more translations as needed
};

const BreadcrumbsWrapper = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs = [
    { labelZh: '首页', labelEn: 'Home', href: '/' },
    ...pathSegments.map((segment, index) => {
      const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
      
      // Get translation or generate fallback labels
      const translation = pathTranslations[segment.toLowerCase()] || {
        zh: segment, // Fallback to English if no Chinese translation
        en: segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      };

      return {
        labelZh: translation.zh,
        labelEn: translation.en,
        href: index === pathSegments.length - 1 ? undefined : href // Last item shouldn't be a link
      };
    })
  ];

  return <Breadcrumbs breadcrumbs={breadcrumbs} />;
};

export default BreadcrumbsWrapper; 