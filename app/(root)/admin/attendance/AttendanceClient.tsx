'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import ReactPaginate from 'react-paginate';
import Modal from '@/components/ui/modal'; // Import the modal component

type User = {
  id: string;
  phoneNumber: string;
  eventTitle: string;
  eventStartDateTime: string;
  eventEndDateTime: string;
  order: {
    queueNumber: string;
    attended: boolean;
    customFieldValues: { id: string; label: string; type: string; value: string; _id: string }[];
  };
};

type Event = {
  _id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  category: {
    name: string;
  };
  maxSeats: number;
};

const AttendanceClient = React.memo(({ event }: { event: Event }) => {
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [queueNumber, setQueueNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const usersPerPage = 10;

  useEffect(() => {
    console.log('Fetching registered users for event:', event._id);
    fetchRegisteredUsers();
  }, []);

  const fetchRegisteredUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${event._id}/attendees`);
      const data = await res.json();
      console.log('Fetched data:', data);
      if (Array.isArray(data.attendees)) {
        setRegisteredUsers(data.attendees);
        console.log('Registered users set:', data.attendees);
      } else {
        setRegisteredUsers([]);
        console.log('No attendees found.');
      }
    } catch (error) {
      console.error('Error fetching registered users:', error);
      setMessage('Failed to fetch registered users.');
      setRegisteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [event._id]);

  const handleMarkAttendance = useCallback(async (userId: string, attended: boolean) => {
    console.log(`Marking attendance for user ${userId}: ${attended}`);
    setShowModal(true);
    setModalMessage('Updating attendance...');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, eventId: event._id, attended }),
      });

      if (res.ok) {
        setRegisteredUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, order: { ...user.order, attended } } : user
          )
        );
        setMessage(`Attendance ${attended ? 'marked' : 'unmarked'} for ${userId}`);
        console.log(`Attendance ${attended ? 'marked' : 'unmarked'} for ${userId}`);
        setModalMessage('Attendance updated successfully.');
      } else {
        throw new Error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Failed to update attendance.');
      setModalMessage('Failed to update attendance.');
    } finally {
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    }
  }, [event._id]);

  const handleQueueNumberSubmit = useCallback(async () => {
    console.log('Submitting queue number:', queueNumber);
    const user = registeredUsers.find(u => u.order.queueNumber === queueNumber);
    if (user) {
      await handleMarkAttendance(user.id, !user.order.attended);
      setQueueNumber('');
    } else {
      setMessage('User not found with this queue number.');
      console.log('User not found with this queue number:', queueNumber);
    }
  }, [queueNumber, registeredUsers, handleMarkAttendance]);

  const handlePageClick = (data: { selected: number }) => {
    setCurrentPage(data.selected);
  };

  const offset = currentPage * usersPerPage;
  const currentPageUsers = registeredUsers.slice(offset, offset + usersPerPage);
  const pageCount = Math.ceil(registeredUsers.length / usersPerPage);

  return (
    <div className="wrapper my-8">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">{event.title}</h2>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">Date:</span> {formatDateTime(new Date(event.startDateTime)).dateOnly}
        </p>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">Time:</span> {formatDateTime(new Date(event.startDateTime)).timeOnly} - {formatDateTime(new Date(event.endDateTime)).timeOnly}
        </p>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">Location:</span> {event.location}
        </p>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">Category:</span> {event.category.name}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Max Seats:</span> {event.maxSeats}
        </p>
      </div>

      <div className="flex space-x-2 mb-6">
        <Input
          placeholder="Enter Queue Number"
          value={queueNumber}
          onChange={(e) => setQueueNumber(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleQueueNumberSubmit} className="bg-blue-500 text-white">
          Mark Attendance
        </Button>
      </div>

      <h4 className="text-xl font-bold mb-4">Registered Users</h4>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p className="mb-4">Total Registrations: {registeredUsers.length}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b">Queue Number</th>
                  {registeredUsers.length > 0 && registeredUsers[0]?.order?.customFieldValues && 
                    registeredUsers[0].order.customFieldValues.map((field) => (
                      <th key={field.id} className="py-2 px-4 border-b">
                        {field.label}
                      </th>
                    ))
                  }
                  <th className="py-2 px-4 border-b">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {currentPageUsers.map((user) => {
                  console.log('Rendering user:', user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{user.order?.queueNumber || 'N/A'}</td>
                      {user.order?.customFieldValues && user.order.customFieldValues.map((field) => {
                        console.log('Rendering custom field:', field.label, field.value);
                        return (
                          <td key={field.id} className="py-2 px-4 border-b">{field.value || 'N/A'}</td>
                        );
                      })}
                      <td className="py-2 px-4 border-b text-center">
                        <input
                          type="checkbox"
                          checked={user.order?.attended || false}
                          onChange={() => handleMarkAttendance(user.id, !(user.order?.attended || false))}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ReactPaginate
            previousLabel={'Previous'}
            nextLabel={'Next'}
            breakLabel={'...'}
            breakClassName={'break-me'}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={'pagination'}
            activeClassName={'active'}
          />
        </>
      )}

      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}

      {showModal && (
        <Modal>
          <p>{modalMessage}</p>
        </Modal>
      )}
    </div>
  );
});

export default AttendanceClient;
