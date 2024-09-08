'use client';

import { currentUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Event = {
  _id: string;
  title: string;
  startDateTime: string;
  category: {
    name: string;
  };
};

const SelectEventPage = () => {
  const [events, setEvents] = useState<Event[]>([]); // Define the type for events
  const [selectedEventId, setSelectedEventId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch('/api/events');
      const result = await response.json();

      // Check if result.data is an array
      if (Array.isArray(result.data)) {
        setEvents(result.data);
      } else {
        console.error('Fetched data is not an array:', result);
        setEvents([]); // Set to an empty array or handle the error as needed
      }
    };

    fetchEvents();
  }, []);

  const handleSelectEvent = () => {
    console.log('Selected Event ID:', selectedEventId);
    if (selectedEventId) {
      router.push(`/admin/attendance?eventId=${selectedEventId}`);
    }
  };

  return (
    <div>
      <h2>Select an Event for Attendance</h2>
      <select onChange={(e) => setSelectedEventId(e.target.value)} value={selectedEventId}>
        <option value="">Select an event</option>
        {events.map((event) => (
          <option key={event._id} value={event._id}>
            {event.title} - {new Date(event.startDateTime).toLocaleString()} - {event.category.name}
          </option>
        ))}
      </select>
      <button onClick={handleSelectEvent} disabled={!selectedEventId}>
        Go to Attendance
      </button>
    </div>
  );
};

export default SelectEventPage;
