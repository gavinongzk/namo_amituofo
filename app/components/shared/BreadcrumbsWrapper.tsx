'use client';

import { usePathname } from 'next/navigation';
import Breadcrumbs from './Breadcrumbs';

const BreadcrumbsWrapper = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...pathSegments.map((segment, index) => {
      const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
      // Convert path segment to readable label (e.g., 'event-details' -> 'Event Details')
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return {
        label,
        href: index === pathSegments.length - 1 ? undefined : href // Last item shouldn't be a link
      };
    })
  ];

  return <Breadcrumbs breadcrumbs={breadcrumbs} />;
};

export default BreadcrumbsWrapper; 