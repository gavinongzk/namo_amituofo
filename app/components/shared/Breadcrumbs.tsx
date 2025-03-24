'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs, className = '' }) => {
  return (
    <nav aria-label="Breadcrumbs" className={`mb-4 ${className}`}>
      <ul className="flex flex-wrap items-center text-sm">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href ? (
              <Link 
                href={item.href}
                className="text-primary-600 hover:text-primary-700 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-gray-700" aria-current="page">
                {item.label}
              </span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">/</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumbs; 