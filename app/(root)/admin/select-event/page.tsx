'use client';

import { currentUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Event = {
  _id: string;
  title: string;
};

const SelectEventPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch('/api/events');
      const result = await response.json();

      if (Array.isArray(result.data)) {
        setEvents(result.data);
      } else {
        console.error('Fetched data is not an array:', result);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-4">Select an Event for Attendance</h2>
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <select
          onChange={(e) => setSelectedEventId(e.target.value)}
          value={selectedEventId}
          className="border border-gray-300 rounded-md p-2 w-full mb-4"
        >
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title}
            </option>
          ))}
        </select>
        <button
          onClick={handleSelectEvent}
          disabled={!selectedEventId}
          className={`w-full py-2 rounded-md text-white ${
            selectedEventId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Go to Attendance
        </button>
      </div>
    </div>
  );
};

export default SelectEventPage;
