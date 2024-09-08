'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  name: string;
  queueNumber: string;
  attended: boolean;
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
      if (Array.isArray(data.attendees)) {
        setRegisteredUsers(data.attendees);
      } else {
        console.error('Received data is not an array:', data);
        setRegisteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching registered users:', error);
      setMessage('Failed to fetch registered users.');
      setRegisteredUsers([]);
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
      <h4 className="text-2xl font-bold mb-4">Select Event for Attendance</h4>
      <div className="relative">
        <select 
          onChange={(e) => setSelectedEventId(e.target.value)} 
          value={selectedEventId}
          className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title} | {new Date(event.startDateTime).toLocaleString()} | {event.category.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>

      {selectedEventId && (
        <>
          <h4>Registered Users</h4>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>Total Registrations: {registeredUsers.length}</p>
              <ul>
                {registeredUsers && registeredUsers.length > 0 ? (
                  registeredUsers.map((user) => (
                    <li key={user.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={user.attended}
                          onChange={() => handleMarkAttendance(user.id, !user.attended)}
                        />
                        {user.name} - Queue: {user.queueNumber}
                      </label>
                    </li>
                  ))
                ) : (
                  <p>No registered users found.</p>
                )}
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
