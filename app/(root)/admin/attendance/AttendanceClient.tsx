'use client'

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  name: string;
  queueNumber: string;
};

const AttendanceClient = ({ events }: { events: { _id: string; title: string }[] }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [queueNumber, setQueueNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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

    try {
      const res = await fetch(`/api/registered-users?eventId=${selectedEventId}`);
      const data = await res.json();
      setRegisteredUsers(data);
    } catch (error) {
      console.error('Error fetching registered users:', error);
      setMessage('Failed to fetch registered users.');
    }
  };

  const handleMarkAttendance = async () => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queueNumber }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`Attendance marked for ${data.order.buyer.firstName} ${data.order.buyer.lastName}`);
    } else {
      setMessage(data.message);
    }
  };

  const handleCheckboxChange = async (userId: string) => {
    setSelectedUsers((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter(id => id !== userId);
      } else {
        return [...prevSelected, userId];
      }
    });

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, attended: !selectedUsers.includes(userId) }),
      });

      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  return (
    <div className="wrapper my-8">
      <h4>Select Event for Attendance</h4>
      <select onChange={(e) => setSelectedEventId(e.target.value)} value={selectedEventId}>
        <option value="">Select an event</option>
        {events.map((event) => (
          <option key={event._id} value={event._id}>
            {event.title}
          </option>
        ))}
      </select>

      {selectedEventId && (
        <>
          <h4>Registered Users</h4>
          <ul>
            {registeredUsers.map((user: User) => (
              <li key={user.id}>
                <label>
                  <input type="checkbox" onChange={() => handleCheckboxChange(user.id)} checked={selectedUsers.includes(user.id)} />
                  {user.name} - {user.queueNumber}
                </label>
              </li>
            ))}
          </ul>

          <Input
            placeholder="Enter Queue Number"
            value={queueNumber}
            onChange={(e) => setQueueNumber(e.target.value)}
            className="input-field"
          />
          <Button onClick={handleMarkAttendance} className="button mt-4">
            Mark Attendance
          </Button>
          {message && <p className="mt-4">{message}</p>}
        </>
      )}
    </div>
  );
};

export default AttendanceClient;
