'use client';

import { currentUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Event = {
  _id: string;
  title: string;
};

const SelectEventPage = () => {
  const [events, setEvents] = useState<Event[]>([]); // Define the type for events
  const [selectedEventId, setSelectedEventId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    };

    fetchEvents();
  }, []);

  const handleSelectEvent = () => {
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
            {event.title}
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
