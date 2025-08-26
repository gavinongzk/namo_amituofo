'use client';

import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigation } from './NavigationProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SmartBackButtonProps {
  fallbackPath?: string;
  showHomeButton?: boolean;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const SmartBackButton = ({
  fallbackPath = '/',
  showHomeButton = true,
  className = '',
  variant = 'ghost',
  size = 'sm',
  showText = false
}: SmartBackButtonProps) => {
  const { canGoBack, goBack } = useNavigation();
  const pathname = usePathname();

  // Don't show on home page
  if (pathname === '/') {
    return null;
  }

  const handleBack = () => {
    if (canGoBack) {
      goBack();
    } else if (fallbackPath) {
      window.location.href = fallbackPath;
    }
  };

  // Map size to Button component compatible size
  const buttonSize = size === 'md' ? 'default' : size;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleBack}
        variant={variant}
        size={buttonSize}
        className="flex items-center gap-2"
        title={canGoBack ? '返回上一页' : '返回首页'}
      >
        <ArrowLeft className="h-4 w-4" />
        {showText && <span>{canGoBack ? '返回' : '首页'}</span>}
      </Button>

      {showHomeButton && (
        <Link href="/">
          <Button
            variant="outline"
            size={buttonSize}
            className="flex items-center gap-2"
            title="返回首页"
          >
            <Home className="h-4 w-4" />
            {showText && <span>首页</span>}
          </Button>
        </Link>
      )}
    </div>
  );
};

export default SmartBackButton;
