import { currentUser } from '@clerk/nextjs';
import NavItems from './NavItems';

const NavWrapper = async () => {
  const user = await currentUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';
  const isNormalAdmin = user?.publicMetadata.role === 'admin';

  return <NavItems isSuperAdmin={isSuperAdmin} isNormalAdmin={isNormalAdmin} />;
};

export default NavWrapper;
