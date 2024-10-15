"use client"

import { useState } from 'react';
import UploadOrders from '@/components/shared/UploadOrders';
import EventSelector from '@/components/shared/EventSelector'; // Import your event selector component
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { Card } from '@/components/ui/card'; // Assuming you have a Card component

type Event = {
    _id: string;
    title: string;
    startDateTime: string;
    endDateTime: string;
    location: string;
    category: {
      name: string;
    };
    maxSeats: number;
};

const UploadOrdersPage = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Upload Orders</h1>
      <EventSelector onEventSelect={handleEventSelect} />

      {selectedEvent && (
        <Card className="mt-6 p-4 shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-2">Selected Event: {selectedEvent.title}</h2>
          <p className="text-gray-600 mb-4">Upload Orders for the event.</p>
          <UploadOrders eventId={selectedEvent._id} />
          <div className="mt-4">
            <Button className="w-full">Upload Orders Excel</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UploadOrdersPage;
