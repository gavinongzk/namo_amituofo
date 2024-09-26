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
    customFieldValues: {
      groupId: string;
      fields: {
        id: string;
        label: string;
        type: string;
        value: string;
      }[];
      queueNumber: string;
      attendance: boolean;
    }[];
    version: number;
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
  const [attendedUsersCount, setAttendedUsersCount] = useState(0);

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
        const attendedCount = data.attendees.reduce((count: number, user: User) => {
          return count + user.order.customFieldValues.filter(group => group.attendance).length;
        }, 0);
        setAttendedUsersCount(attendedCount);
        console.log('Registered users set:', data.attendees);
      } else {
        setRegisteredUsers([]);
        setAttendedUsersCount(0);
        console.log('No attendees found.');
      }
    } catch (error) {
      console.error('Error fetching registered users:', error);
      setMessage('Failed to fetch registered users. 获取注册用户失败。');
      setRegisteredUsers([]);
      setAttendedUsersCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [event._id]);

  const handleMarkAttendance = useCallback(async (userId: string, groupId: string, attended: boolean) => {
    console.log(`Marking attendance for user ${userId}, group ${groupId}: ${attended}`);
    setShowModal(true);
    setModalMessage('Updating attendance... 更新出席情况...');
    try {
      const user = registeredUsers.find(user => user.id === userId);
      const group = user?.order.customFieldValues.find(group => group.groupId === groupId);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, eventId: event._id, groupId, attended, version: user?.order.version }),
      });

      if (res.ok) {
        setRegisteredUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId
              ? {
                  ...user,
                  order: {
                    ...user.order,
                    customFieldValues: user.order.customFieldValues.map(group =>
                      group.groupId === groupId ? { ...group, attendance: attended } : group
                    ),
                    version: user.order.version + 1,
                  },
                }
              : user
          )
        );
        setAttendedUsersCount(prevCount => attended ? prevCount + 1 : prevCount - 1);
        setMessage(`Attendance ${attended ? 'marked' : 'unmarked'} for ${userId}, group ${groupId}`);
        console.log(`Attendance ${attended ? 'marked' : 'unmarked'} for ${userId}, group ${groupId}`);
        setModalMessage(`Attendance ${attended ? 'marked' : 'unmarked'} for queue number ${group?.queueNumber}`);
      } else if (res.status === 409) {
        setModalMessage('Refreshing due to an update by someone else. 正在刷新，因为有其他人更新了数据。');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Failed to update attendance 更新出席情况失败');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Failed to update attendance. 更新出席情况失败。');
      setModalMessage('Failed to update attendance. 更新出席情况失败。');
    } finally {
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    }
  }, [event._id, registeredUsers]);

  const handleQueueNumberSubmit = useCallback(async () => {
    console.log('Submitting queue number:', queueNumber);
    const user = registeredUsers.find(u => u.order.customFieldValues.some(group => group.queueNumber === queueNumber));
    if (user) {
      const group = user.order.customFieldValues.find(group => group.queueNumber === queueNumber);
      if (group) {
        await handleMarkAttendance(user.id, group.groupId, !group.attendance);
        setQueueNumber('');
      }
    } else {
      setMessage('User not found with this queue number. 未找到此排队号码的用户。');
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
          <p className="mb-2">Total Registrations 总注册数: {registeredUsers.length}</p>
          <p className="mb-4">Attended Users 已出席用户: {attendedUsersCount}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Queue Number 排队号码</th>
                  {registeredUsers.length > 0 && registeredUsers[0]?.order?.customFieldValues && 
                    registeredUsers[0].order.customFieldValues.flatMap(group => 
                      group.fields.map(field => (
                        <th key={`${group.groupId}_${field.id}`} className="py-2 px-4 border-b text-left">
                          {field.label}
                        </th>
                      ))
                    )
                  }
                  <th className="py-2 px-4 border-b text-center">Attendance 出席</th>
                </tr>
              </thead>
              <tbody>
                {currentPageUsers.map((user) => (
                  user.order.customFieldValues.map((group) => (
                    <tr key={`${user.id}_${group.groupId}`} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b text-left">{group.queueNumber || 'N/A'}</td>
                      {group.fields.map(field => (
                        <td key={`${group.groupId}_${field.id}`} className="py-2 px-4 border-b text-left">
                          {field.value || 'N/A'}
                        </td>
                      ))}
                      <td className="py-2 px-4 border-b text-center">
                        <input
                          type="checkbox"
                          checked={group.attendance || false}
                          onChange={() => handleMarkAttendance(user.id, group.groupId, !(group.attendance || false))}
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
