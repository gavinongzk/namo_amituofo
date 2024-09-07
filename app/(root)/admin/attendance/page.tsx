import { currentUser } from '@clerk/nextjs';
import AttendanceClient from './AttendanceClient';
import { useEffect, useState } from 'react';

// Define the Event type
type Event = {
  _id: string;
  title: string;
};

const AttendancePage = async () => {
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  if (!isAdmin) {
    return <div>You do not have access to this page.</div>;
  }

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    };

    fetchEvents();
  }, []);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  return (
    <div>
      <h2>Select Event for Attendance</h2>
      <select onChange={(e) => handleEventChange(e.target.value)} value={selectedEventId}>
        <option value="">Select an event</option>
        {events.map((event) => (
          <option key={event._id} value={event._id}>
            {event.title}
          </option>
        ))}
      </select>

      {selectedEventId && <AttendanceClient eventId={selectedEventId} />}
    </div>
  );
};

export default AttendancePage;