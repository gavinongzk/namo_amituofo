'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  queueNumber: string;
  attended: boolean;
  phoneNumber?: string; // Add this line
};

type Event = {
  _id: string;
  title: string;
  startDateTime: string;
  category: {
    name: string;
  };
};

const AttendanceClient = ({ events }: { events: Event[] }) => {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '';

  const [selectedEventId, setSelectedEventId] = useState<string>(eventId);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [queueNumber, setQueueNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegisteredUsers();
    }
  }, [selectedEventId]);

  const fetchRegisteredUsers = async () => {
    if (!selectedEventId) {
      console.error('Event ID is undefined');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/attendees`);
      const data = await res.json();
      setRegisteredUsers(data);
    } catch (error) {
      console.error('Error fetching registered users:', error);
      setMessage('Failed to fetch registered users.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async (userId: string, attended: boolean) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, eventId: selectedEventId, attended }),
      });

      if (res.ok) {
        setRegisteredUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, attended } : user
          )
        );
        setMessage(`Attendance ${attended ? 'marked' : 'unmarked'} for ${userId}`);
      } else {
        throw new Error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Failed to update attendance.');
    }
  };

  const handleQueueNumberSubmit = async () => {
    const user = registeredUsers.find(u => u.queueNumber === queueNumber);
    if (user) {
      await handleMarkAttendance(user.id, !user.attended);
      setQueueNumber('');
    } else {
      setMessage('User not found with this queue number.');
    }
  };

  return (
    <div className="wrapper my-8">
      <h4>Select Event for Attendance</h4>
      <select onChange={(e) => setSelectedEventId(e.target.value)} value={selectedEventId}>
        <option value="">Select an event</option>
        {events.map((event) => (
          <option key={event._id} value={event._id}>
            {event.title} | {new Date(event.startDateTime).toLocaleString()} | {event.category.name}
          </option>
        ))}
      </select>

      {selectedEventId && (
        <>
          <h4>Registered Users</h4>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>Total Registrations: {registeredUsers.length}</p>
              <ul>
                {registeredUsers.map((user) => (
                  <li key={user.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={user.attended}
                        onChange={() => handleMarkAttendance(user.id, !user.attended)}
                      />
                      {user.firstName} {user.lastName} - Queue: {user.queueNumber}
                      {user.phoneNumber && ` - Phone: ${user.phoneNumber}`}
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          <Input
            placeholder="Enter Queue Number"
            value={queueNumber}
            onChange={(e) => setQueueNumber(e.target.value)}
            className="input-field"
          />
          <Button onClick={handleQueueNumberSubmit} className="button mt-4">
            Mark Attendance by Queue Number
          </Button>
          {message && <p className="mt-4">{message}</p>}
        </>
      )}
    </div>
  );
};

export default AttendanceClient;
