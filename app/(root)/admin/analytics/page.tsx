'use client'

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/shared/AnalyticsDashboard';

interface AttendeeEvent {
  eventDate: string;
  eventTitle: string;
  category: {
    name: string;
  };
}

interface AttendeeData {
  name: string;
  phoneNumber: string;
  postalCode: string;
  region: string;
  town: string;
  eventCount: number;
  events: AttendeeEvent[];
}

interface Attendee extends AttendeeData {
  lastEventDate: string;
  eventDate: string;
  eventTitle: string;
}

const AdminAnalyticsPage = () => {
  const { user, isLoaded } = useUser();
  const [, setIsSuperAdmin] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata.role as string;
      setIsSuperAdmin(role === 'superadmin');
      if (role !== 'superadmin') {
        redirect('/');
      }
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setAttendees(data || []);
        } else {
          console.error('Failed to fetch analytics data');
          setAttendees([]);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAttendees([]);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user?.publicMetadata.role === 'superadmin') {
      fetchAnalytics();
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) return <div>Loading...</div>;

  return (
    <div className="wrapper my-8">
      <AnalyticsDashboard attendees={attendees} />
    </div>
  );
};

export default AdminAnalyticsPage;