import { currentUser } from '@clerk/nextjs';
import NavItems from './NavItems';

const NavWrapper = async () => {
  const user = await currentUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';

  return <NavItems isSuperAdmin={isSuperAdmin} />;
};

export default NavWrapper;
