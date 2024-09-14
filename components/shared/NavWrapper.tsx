'use client'

import { useUser } from '@clerk/nextjs';
import NavItems from './NavItems';

const NavWrapper = () => {
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';
  const isNormalAdmin = user?.publicMetadata.role === 'admin';

  return <NavItems isSuperAdmin={isSuperAdmin} isNormalAdmin={isNormalAdmin} />;
};

export default NavWrapper;