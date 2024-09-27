'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RegistrationCollection from '@/components/shared/RegistrationCollection';
import Collection from '@/components/shared/Collection';
import { getEventsByUser } from '@/lib/actions/event.actions';
import { getOrdersByPhoneNumber } from '@/lib/actions/order.actions';
import Link from 'next/link';
import { CustomField } from '@/types';
import { IEvent } from '@/lib/database/models/event.model';

interface Event extends IEvent {
  orderId?: string;
  customFieldValues?: CustomField[];
  queueNumber?: string;
  registrationCount?: number;
}

interface EventsData {
  data: Event[];
  totalPages: number;
}

const ProfilePage = () => {
  const { isSignedIn, user } = useUser();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState<EventsData>({ data: [], totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSignedIn && user) {
      fetchOrganizedEvents();
    }
  }, [isSignedIn, user]);

  const fetchOrganizedEvents = async () => {
    if (user?.publicMetadata?.userId) {
      const eventsData = await getEventsByUser({ userId: user.publicMetadata.userId as string, page: 1 });
      setOrganizedEvents(eventsData || { data: [], totalPages: 0 });
    }
  };

  const handleLookup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const orders = await getOrdersByPhoneNumber(phoneNumber);
      setRegistrations(orders);
    } catch (err) {
      setError('Failed to fetch registrations. Please try again.');
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="wrapper my-8 flex flex-col gap-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Order Lookup</h3>
      </section>

      <div className="flex flex-col gap-4">
        <Input
          type="tel"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <Button onClick={handleLookup} disabled={isLoading}>
          {isLoading ? 'Looking up...' : 'Lookup Orders'}
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {registrations.length > 0 && (
        <RegistrationCollection 
          data={registrations}
          emptyTitle="No registrations found"
          emptyStateSubtext="No registrations found for this phone number."
          collectionType="All_Registrations"
          limit={6}
          page={1}
          totalPages={1}
        />
      )}

      {isSignedIn && organizedEvents.data.length > 0 && (
        <>
          <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
            <div className="wrapper flex items-center justify-center sm:justify-between">
              <h3 className='h3-bold text-center sm:text-left'>Events Organized</h3>
              <Button asChild size="lg" className="button hidden sm:flex">
                <Link href="/events/create">
                  Create New Event
                </Link>
              </Button>
            </div>
          </section>

          <Collection 
            data={organizedEvents.data}
            emptyTitle="No events have been created yet"
            emptyStateSubtext="Go create some now"
            collectionType="Events_Organized"
            limit={3}
            page={1}
            totalPages={organizedEvents.totalPages}
          />
        </>
      )}
    </div>
  );
};

export default ProfilePage;