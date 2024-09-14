import React from 'react';
import { useUser } from '@clerk/nextjs';
import NavItems from './NavItems';

interface NavWrapperProps {
  className?: string;
}

const NavWrapper: React.FC<NavWrapperProps> = ({ className }) => {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'superadmin';
  const isNormalAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <NavItems 
      isSuperAdmin={isSuperAdmin} 
      isNormalAdmin={isNormalAdmin} 
      className={className}
    />
  );
};

export default NavWrapper;