'use client'

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  name: string;
  queueNumber: string;
};

const AttendanceClient = ({ eventId }: { eventId: string }) => {
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [queueNumber, setQueueNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchRegisteredUsers();
  }, [eventId]);

  const fetchRegisteredUsers = async () => {
    if (!eventId) {
      console.error('Event ID is undefined');
      return;
    }

    try {
      const res = await fetch(`/api/registered-users?eventId=${eventId}`);
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

  const handleCheckboxChange = (userId: string) => {
    setSelectedUsers((prevSelected) => {
      if (prevSelected.includes(userId)) {
        // If user is already selected, remove them
        return prevSelected.filter(id => id !== userId);
      } else {
        // If user is not selected, add them
        return [...prevSelected, userId];
      }
    });
  };

  return (
    <div className="wrapper my-8">
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
    </div>
  );
};

export default AttendanceClient;
