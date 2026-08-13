'use client'

import { useUser } from '@clerk/nextjs';
import NavItems from './NavItems';
import { useClerkEnabled } from '@/components/providers/ClerkEnabledContext';

interface NavWrapperProps {
  onClose?: () => void;
}

const NavWrapper: React.FC<NavWrapperProps> = ({ onClose }) => {
  const clerkEnabled = useClerkEnabled();
  if (!clerkEnabled) {
    return <NavItems isSuperAdmin={false} isNormalAdmin={false} isSignedIn={false} onClose={onClose} />;
  }
  return <NavWrapperWithClerk onClose={onClose} />;
};

const NavWrapperWithClerk: React.FC<NavWrapperProps> = ({ onClose }) => {
  const { user, isSignedIn } = useUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';
  const isNormalAdmin = user?.publicMetadata.role === 'admin';

  return (
    <NavItems
      isSuperAdmin={isSuperAdmin}
      isNormalAdmin={isNormalAdmin}
      isSignedIn={!!isSignedIn}
      onClose={onClose}
    />
  );
};

export default NavWrapper;
