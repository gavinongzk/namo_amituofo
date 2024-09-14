import React from 'react';
import { useUser } from '@clerk/nextjs';
import NavItems from './NavItems';

interface NavWrapperProps {
  className?: string;
  closeSheet?: () => void;
}

const NavWrapper: React.FC<NavWrapperProps> = ({ className, closeSheet }) => {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'superadmin';
  const isNormalAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <NavItems 
      isSuperAdmin={isSuperAdmin} 
      isNormalAdmin={isNormalAdmin} 
      className={className}
      onItemClick={closeSheet}
    />
  );
};

export default NavWrapper;