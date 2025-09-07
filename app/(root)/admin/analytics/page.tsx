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
  const [error, setError] = useState<string | null>(null);

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
        setError(null);
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setAttendees(data || []);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch analytics data' }));
          setError(errorData.message || 'Failed to fetch analytics data');
          setAttendees([]);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Network error occurred while fetching analytics data');
        setAttendees([]);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user?.publicMetadata.role === 'superadmin') {
      fetchAnalytics();
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="wrapper my-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrapper my-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper my-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          View attendee statistics and event analytics
        </p>
      </div>
      <AnalyticsDashboard attendees={attendees} />
    </div>
  );
};

export default AdminAnalyticsPage;