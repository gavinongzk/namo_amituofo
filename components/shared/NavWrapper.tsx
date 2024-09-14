'use client'

import { useUser } from '@clerk/nextjs';
import NavItems from './NavItems';

interface NavWrapperProps {
  onClose: () => void;
}

const NavWrapper: React.FC<NavWrapperProps> = ({ onClose }) => {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';
  const isNormalAdmin = user?.publicMetadata.role === 'admin';

  return <NavItems isSuperAdmin={isSuperAdmin} isNormalAdmin={isNormalAdmin} onClose={onClose} />;
};

export default NavWrapper;