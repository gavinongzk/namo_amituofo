"use client"

import { useState } from 'react';
import UploadOrders from '@/components/shared/UploadOrders';
import EventSelector from '@/components/shared/EventSelector'; // Import your event selector component
import { Event } from '@/types';

const UploadOrdersPage = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div>
      <EventSelector onEventSelect={handleEventSelect} />

      {selectedEvent && <UploadOrders eventId={selectedEvent._id} />}
    </div>
  );
};

export default UploadOrdersPage;
