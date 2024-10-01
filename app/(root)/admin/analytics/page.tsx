'use client'

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/shared/AnalyticsDashboard';

const AdminAnalyticsPage = () => {
  const { user, isLoaded } = useUser();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata.role as string;
      setIsSuperAdmin(role === 'superadmin');
      if (role !== 'superadmin') {
        redirect('/');
      }
    }
  }, [isLoaded, user]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="wrapper my-8">
      <h1 className="h2-bold mb-8">Analytics Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  );
};

export default AdminAnalyticsPage;