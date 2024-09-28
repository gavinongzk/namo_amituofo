'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import ReactPaginate from 'react-paginate';
import Modal from '@/components/ui/modal';

type EventRegistration = {
  id: string;
  eventTitle: string;
  eventStartDateTime: string;
  eventEndDateTime: string;
  order: {
    customFieldValues: {
      groupId: string;
      queueNumber: string;
      attendance: boolean;
      fields: {
        id: string;
        label: string;
        type: string;
        value: string;
      }[];
      __v: number;
    }[];
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

interface Attendee {
  order: {
    customFieldValues: Array<{
      attendance: boolean;
    }>;
  };
}

const AttendanceClient = React.memo(({ event }: { event: Event }) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [queueNumber, setQueueNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const usersPerPage = 10;
  const [attendedUsersCount, setAttendedUsersCount] = useState(0);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event._id}/attendees`);
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      const data = await response.json();
      if (Array.isArray(data.attendees)) {
        setRegistrations(data.attendees);
        const attendedCount = data.attendees.reduce((count: number, registration: EventRegistration) => {
          return count + registration.order.customFieldValues.filter(group => group.attendance).length;
        }, 0);
        setAttendedUsersCount(attendedCount);
      } else {
        setRegistrations([]);
        setAttendedUsersCount(0);
        setMessage('No registrations found for this event. 未找到此活动的注册。');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setMessage('Failed to fetch registrations. 获取注册失败。');
      setRegistrations([]);
      setAttendedUsersCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [event._id]);

  useEffect(() => {
    console.log('Fetching registrations for event:', event._id);
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleMarkAttendance = useCallback(async (registrationId: string, groupId: string, attended: boolean) => {
    console.log(`Marking attendance for registration ${registrationId}, group ${groupId}: ${attended}`);
    setShowModal(true);
    setModalMessage('Updating attendance... 更新出席情况...');
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const [orderId, orderGroupId] = registrationId.split('_');
        const registration = registrations.find(reg => reg.id === registrationId);
        const group = registration?.order.customFieldValues.find(g => g.groupId === groupId);
        
        if (!registration || !group) {
          throw new Error('Registration or group not found');
        }

        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            orderId, 
            eventId: event._id, 
            groupId, 
            attended, 
            version: group.__v 
          }),
        });

        if (res.ok) {
          const updatedRegistration = await res.json();
          setRegistrations(prevRegistrations =>
            prevRegistrations.map(r => {
              if (r.id === registrationId) {
                // Find the specific group within the registration
                const updatedCustomFieldValues = r.order.customFieldValues.map(group => 
                  group.groupId === groupId 
                    ? { ...group, attendance: attended, __v: updatedRegistration.order.customFieldValues[0].__v }
                    : group
                );
                return { ...r, order: { ...r.order, customFieldValues: updatedCustomFieldValues } };
              }
              return r;
            })
          );
          setAttendedUsersCount(prevCount => attended ? prevCount + 1 : prevCount - 1);
          setMessage(`Attendance ${attended ? 'marked' : 'unmarked'} for ${registrationId}, group ${groupId}`);
          setModalMessage(`Attendance ${attended ? 'marked' : 'unmarked'} for queue number ${group.queueNumber}`);
          break;
        } else if (res.status === 409) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempts)); // Exponential backoff
          await fetchRegistrations(); // Refresh the data
        } else {
          throw new Error('Failed to update attendance 更新出席情况失败');
        }
      } catch (error) {
        console.error('Error updating attendance:', error);
        setMessage('Failed to update attendance. 更新出席情况失败。');
        setModalMessage('Failed to update attendance. 更新出席情况失败。');
        break;
      }
    }

    setTimeout(() => {
      setShowModal(false);
    }, 2000);
  }, [event._id, registrations, fetchRegistrations]);

  const handleQueueNumberSubmit = useCallback(async () => {
    console.log('Submitting queue number:', queueNumber);
    const registration = registrations.find(r => r.order.customFieldValues.some(group => group.queueNumber === queueNumber));
    if (registration) {
      const group = registration.order.customFieldValues[0];
      if (group) {
        await handleMarkAttendance(registration.id, group.groupId, !group.attendance);
        setQueueNumber('');
      }
    } else {
      setMessage('Registration not found with this queue number. 未找到此排队号码的注册。');
      console.log('Registration not found with this queue number:', queueNumber);
    }
  }, [queueNumber, registrations, handleMarkAttendance]);

  const handlePageClick = (data: { selected: number }) => {
    setCurrentPage(data.selected);
  };

  const offset = currentPage * usersPerPage;
  const currentPageRegistrations = registrations.slice(offset, offset + usersPerPage);
  const pageCount = Math.ceil(registrations.length / usersPerPage);

  return (
    <div className="wrapper my-8">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">{event.title}</h2>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">Date 日期:</span> {formatDateTime(new Date(event.startDateTime)).dateOnly}
        </p>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">Time 时间:</span> {formatDateTime(new Date(event.startDateTime)).timeOnly} - {formatDateTime(new Date(event.endDateTime)).timeOnly}
        </p>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">Location 地点:</span> {event.location}
        </p>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">Category 类别:</span> {event.category.name}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Max Seats 最大座位数:</span> {event.maxSeats}
        </p>
      </div>

      <div className="flex space-x-2 mb-6">
        <Input
          placeholder="Enter Queue Number 输入排队号码"
          value={queueNumber}
          onChange={(e) => setQueueNumber(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleQueueNumberSubmit} className="bg-blue-500 text-white">
          Mark Attendance 标记出席
        </Button>
      </div>

      <h4 className="text-xl font-bold mb-4">Registered Users 注册用户</h4>
      {isLoading ? (
        <p>Loading... 加载中...</p>
      ) : (
        <>
          <p className="mb-2">Total Registrations 总注册: {registrations.reduce((count, registration) => count + registration.order.customFieldValues.length, 0)}</p>
          <p className="mb-4">Attended Users 已出席用户: {attendedUsersCount}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Queue Number 排队号码</th>
                  {registrations.length > 0 && registrations[0]?.order?.customFieldValues[0]?.fields && 
                    registrations[0].order.customFieldValues[0].fields
                      .filter(field => !['name'].includes(field.label.toLowerCase()))
                      .map(field => (
                        <th key={field.id} className="py-2 px-4 border-b text-left">
                          {field.label}
                        </th>
                      ))
                  }
                  <th className="py-2 px-4 border-b text-center">Attendance 出席</th>
                </tr>
              </thead>
              <tbody>
                {currentPageRegistrations.map((registration) => (
                  registration.order.customFieldValues.map((group) => (
                    <tr key={`${registration.id}_${group.groupId}`} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b text-left">{group.queueNumber || 'N/A'}</td>
                      {group.fields
                        .filter(field => !['name'].includes(field.label.toLowerCase()))
                        .map(field => (
                          <td key={field.id} className="py-2 px-4 border-b text-left">
                            {field.value || 'N/A'}
                          </td>
                        ))
                      }
                      <td className="py-2 px-4 border-b text-center">
                        <input
                          type="checkbox"
                          checked={group.attendance || false}
                          onChange={() => handleMarkAttendance(registration.id, group.groupId, !(group.attendance || false))}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
          <ReactPaginate
            previousLabel={'Previous 上一页'}
            nextLabel={'Next 下一页'}
            breakLabel={'...'}
            breakClassName={'break-me'}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={'pagination flex justify-center mt-4'}
            pageClassName={'page-item'}
            pageLinkClassName={'page-link px-3 py-1 border rounded'}
            previousClassName={'page-item'}
            previousLinkClassName={'page-link px-3 py-1 border rounded mr-2'}
            nextClassName={'page-item'}
            nextLinkClassName={'page-link px-3 py-1 border rounded ml-2'}
            activeClassName={'active'}
            activeLinkClassName={'bg-blue-500 text-white'}
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
