'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RegistrationCollection from '@/components/shared/RegistrationCollection';
import { getOrdersByPhoneNumber } from '@/lib/actions/order.actions';

const EventLookupPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        <h3 className="wrapper h3-bold text-center sm:text-left">Event Lookup</h3>
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
    </div>
  );
};

export default EventLookupPage;
