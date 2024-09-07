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

  useEffect(() => {
    fetchRegisteredUsers();
  }, []);

  const fetchRegisteredUsers = async () => {
    if (!eventId) {
      console.error('Event ID is undefined');
      return; // or handle the case where eventId is not available
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

  const handleCheckboxChange = async (userId: string) => {
    console.log(`Marking attendance for user ID: ${userId}`);
  };

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Mark Attendance</h3>
      </section>

      <div className="wrapper my-8">
        <h4>Registered Users</h4>
        <ul>
          {registeredUsers.map((user: User) => (
            <li key={user.id}>
              <label>
                <input
                  type="checkbox"
                  onChange={() => handleCheckboxChange(user.id)}
                />
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
    </div>
  );
};

export default AttendanceClient;
