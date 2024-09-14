'use client';

import NavItems from './NavItems';

const NavWrapper = ({ isSuperAdmin, isNormalAdmin }: { isSuperAdmin: boolean; isNormalAdmin: boolean }) => {
  return <NavItems isSuperAdmin={isSuperAdmin} isNormalAdmin={isNormalAdmin} />;
};

export default NavWrapper;
