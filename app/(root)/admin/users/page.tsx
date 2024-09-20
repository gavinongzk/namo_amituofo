'use client'

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import UserManagement from '@/components/shared/UserManagement';

const AdminUsersPage = () => {
  const { user, isLoaded } = useUser();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata.role as string;
      setIsSuperAdmin(role === 'superadmin');
      if (role !== 'superadmin' && role !== 'admin') {
        redirect('/');
      }
    }
  }, [isLoaded, user]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="wrapper my-8">
      <h1 className="h2-bold mb-8">User Management</h1>
      <UserManagement />
    </div>
  );
};

export default AdminUsersPage;
