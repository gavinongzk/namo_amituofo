'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Event = {
  _id: string;
  title: string;
  startDateTime: string;
  category: {
    name: string;
  };
};

const SelectEventPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata.role as string;
      if (role !== 'admin' && role !== 'superadmin') {
        router.push('/');
      }
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const result = await response.json();

        if (Array.isArray(result.data)) {
          setEvents(result.data);
        } else {
          console.error('Fetched data is not an array:', result);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  const handleSelectEvent = () => {
    if (selectedEventId) {
      router.push(`/admin/attendance?eventId=${selectedEventId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">Select an Event for Attendance</h2>
        <Select onValueChange={setSelectedEventId} value={selectedEventId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event._id} value={event._id}>
                {event.title} | {new Date(event.startDateTime).toLocaleString()} | {event.category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleSelectEvent} 
          disabled={!selectedEventId}
          className="w-full"
        >
          Go to Attendance
        </Button>
      </div>
    </div>
  );
};

export default SelectEventPage;
