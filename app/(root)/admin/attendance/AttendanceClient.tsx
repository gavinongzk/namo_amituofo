'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import { useUser } from "@clerk/nextjs";
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import AttendanceDetailsCard from '@/components/shared/AttendanceDetails';
import { isEqual } from 'lodash';

type EventRegistration = {
  id: string;
  eventTitle: string;
  eventStartDateTime: string;
  eventEndDateTime: string;
  order: {
    _id: string;
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
      cancelled: boolean;
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

function useDeepCompareMemo<T>(factory: () => T, dependencies: React.DependencyList) {
  const ref = useRef<{ deps: React.DependencyList; obj: T; initialized: boolean }>({
    deps: dependencies,
    obj: undefined as unknown as T,
    initialized: false,
  });

  if (ref.current.initialized === false || !isEqual(dependencies, ref.current.deps)) {
    ref.current.deps = dependencies;
    ref.current.obj = factory();
    ref.current.initialized = true;
  }

  return ref.current.obj;
}

interface AttendanceItem {
  registrationId: string;
  groupId: string;
  queueNumber: string;
  name: string;
  phoneNumber: string;
  isDuplicate: boolean;
  cannotWalk: boolean | undefined;
  attendance: boolean;
  cancelled: boolean;
  remarks: string;
}

interface SortConfig {
  key: keyof AttendanceItem;
  direction: 'asc' | 'desc';
}

const AttendanceClient = React.memo(({ event }: { event: Event }) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [queueNumber, setQueueNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [attendedUsersCount, setAttendedUsersCount] = useState(0);
  const { user } = useUser();
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationData, setDeleteConfirmationData] = useState<{ registrationId: string; groupId: string; queueNumber: string } | null>(null);
  const [cannotReciteAndWalkCount, setCannotReciteAndWalkCount] = useState(0);
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';
  const [taggedUsers, setTaggedUsers] = useState<Record<string, string>>({});

  const calculateCounts = useCallback((registrations: EventRegistration[]) => {
    let total = 0;
    let attended = 0;
    let cannotReciteAndWalk = 0;

    registrations.forEach(registration => {
      registration.order.customFieldValues.forEach(group => {
        if (!group.cancelled) {
          total += 1;
          if (group.attendance) attended += 1;
          const walkField = group.fields.find(field => field.label.toLowerCase().includes('walk'));
          if (walkField && ['no', '否', 'false'].includes(walkField.value.toLowerCase())) {
            cannotReciteAndWalk += 1;
          }
        }
      });
    });

    setTotalRegistrations(total);
    setAttendedUsersCount(attended);
    setCannotReciteAndWalkCount(cannotReciteAndWalk);
  }, []);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event._id}/attendees`);
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      const data = await response.json();
      if (Array.isArray(data.attendees)) {
        setRegistrations(data.attendees.map((registration: EventRegistration) => ({
          ...registration,
          order: {
            ...registration.order,
            customFieldValues: registration.order.customFieldValues.map((group) => ({
              ...group,
              cancelled: group.cancelled || false // Ensure cancelled is always a boolean
            }))
          }
        })));
        const attendedCount = data.attendees.reduce((count: number, registration: EventRegistration) => {
          return count + registration.order.customFieldValues.filter(group => group.attendance && !group.cancelled).length;
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

  const fetchTaggedUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/tagged-users');
      const data = await response.json();
      const taggedUsersMap = data.reduce((acc: Record<string, string>, user: { phoneNumber: string; remarks: string }) => {
        acc[user.phoneNumber] = user.remarks;
        return acc;
      }, {});
      setTaggedUsers(taggedUsersMap);
    } catch (error) {
      console.error('Error fetching tagged users:', error);
    }
  }, []);

  useEffect(() => {
    fetchTaggedUsers();
  }, [fetchTaggedUsers]);

  useEffect(() => {
    calculateCounts(registrations);
  }, [registrations, calculateCounts]);

  const handleMarkAttendance = useCallback(async (registrationId: string, groupId: string, attended: boolean) => {
    console.log(`Marking attendance for registration ${registrationId}, group ${groupId}: ${attended}`);
    setShowModal(true);
    setModalMessage('Updating attendance... 更新出席情况...');

    try {
      const [orderId] = registrationId.split('_');
      
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId, 
          eventId: event._id, 
          groupId, 
          attended
        }),
      });

      if (res.ok) {
        const updatedRegistration = await res.json();
        setRegistrations(prevRegistrations =>
          prevRegistrations.map(r => {
            if (r.id === registrationId) {
              const updatedCustomFieldValues = r.order.customFieldValues.map(g => 
                g.groupId === groupId 
                  ? { ...g, attendance: attended }
                  : g
              );
              return { ...r, order: { ...r.order, customFieldValues: updatedCustomFieldValues } };
            }
            return r;
          })
        );
        setMessage(`Attendance ${attended ? 'marked' : 'unmarked'} for ${registrationId}, group ${groupId}`);

        setModalMessage(`Attendance ${attended ? 'marked' : 'unmarked'} successfully`);
        setTimeout(() => {
          setShowModal(false);
        }, 1000);

        // Update counts based on updated registrations
        const updatedRegistrations = registrations.map(r => {
          if (r.id === registrationId) {
            return {
              ...r,
              order: {
                ...r.order,
                customFieldValues: r.order.customFieldValues.map(g => 
                  g.groupId === groupId 
                    ? { ...g, attendance: attended }
                    : g
                )
              }
            };
          }
          return r;
        });
        calculateCounts(updatedRegistrations);
      } else {
        throw new Error('Failed to update attendance 更新出席情况失败');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Failed to update attendance. 更新出席情况失败。');
      setModalMessage('Failed to update attendance. 更新出席情况失败。');
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    }
  }, [event._id, registrations, calculateCounts]);

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

  const handleCancelRegistration = useCallback(async (registrationId: string, groupId: string, queueNumber: string, cancelled: boolean) => {
    setShowModal(true);
    setModalMessage(cancelled ? 'Cancelling registration... 取消注册中...' : 'Uncancelling registration... 恢复注册中...');

    try {
      const [orderId] = registrationId.split('_');
      if (!orderId) {
        throw new Error('Invalid registration ID');
      }

      const res = await fetch('/api/cancel-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, groupId, cancelled }),
      });

      if (res.ok) {
        setMessage(`Registration ${cancelled ? 'cancelled' : 'uncancelled'} successfully for ${registrationId}, group ${groupId}`);
        setModalMessage(`Registration ${cancelled ? 'cancelled' : 'uncancelled'} successfully for queue number ${queueNumber}`);

        // Update registrations state
        const updatedRegistrations = registrations.map(r => {
          if (r.id === registrationId) {
            return {
              ...r,
              order: {
                ...r.order,
                customFieldValues: r.order.customFieldValues.map(g => 
                  g.groupId === groupId 
                    ? { ...g, cancelled }
                    : g
                )
              }
            };
          }
          return r;
        });
        setRegistrations(updatedRegistrations);

        // Update counts based on updated registrations
        calculateCounts(updatedRegistrations);

        setTimeout(() => {
          setShowModal(false);
        }, 2000);
      } else {
        throw new Error(`Failed to ${cancelled ? 'cancel' : 'uncancel'} registration 操作失败`);
      }
    } catch (error) {
      console.error(`Error ${cancelled ? 'cancelling' : 'uncancelling'} registration:`, error);
      setModalMessage(`Failed to ${cancelled ? 'cancel' : 'uncancel'} registration. 操作失败。`);
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    }
  }, [registrations, calculateCounts]);

  const handleDeleteRegistration = useCallback(async (registrationId: string, groupId: string, queueNumber: string) => {
    setShowDeleteConfirmation(true);
    setDeleteConfirmationData({ registrationId, groupId, queueNumber });
  }, []);

  const confirmDeleteRegistration = useCallback(async () => {
    if (!deleteConfirmationData) return;

    const { registrationId, groupId, queueNumber } = deleteConfirmationData;
    setShowDeleteConfirmation(false);
    setShowModal(true);
    setModalMessage('Deleting registration... 删除注册中...');

    try {
      const res = await fetch('/api/delete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: registrationId.split('_')[0], groupId }),
      });

      if (res.ok) {
        setMessage(`Registration deleted for ${registrationId}, group ${groupId}`);
        setModalMessage(`Registration deleted for queue number ${queueNumber}`);

        // Update registrations state
        const updatedRegistrations = registrations.filter(r => {
          if (r.id === registrationId) {
            return !r.order.customFieldValues.some(g => g.groupId === groupId);
          }
          return true;
        });
        setRegistrations(updatedRegistrations);

        // Update counts based on updated registrations
        calculateCounts(updatedRegistrations);
      } else {
        throw new Error('Failed to delete registration 删除注册失败');
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      setMessage('Failed to delete registration. 删除注册失败。');
      setModalMessage('Failed to delete registration. 删除注册失败。');
    }

    setTimeout(() => {
      setShowModal(false);
    }, 2000);
  }, [deleteConfirmationData, registrations, calculateCounts]);

  const groupRegistrationsByPhone = useCallback(() => {
    const phoneGroups: { [key: string]: { id: string; queueNumber: string }[] } = {};
    registrations.forEach(registration => {
      registration.order.customFieldValues.forEach(group => {
        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || field.type === 'phone'
        );
        if (phoneField) {
          if (!phoneGroups[phoneField.value]) {
            phoneGroups[phoneField.value] = [];
          }
          phoneGroups[phoneField.value].push({
            id: `${registration.id}_${group.groupId}`,
            queueNumber: group.queueNumber || ''
          });
        }
      });
    });
    return phoneGroups;
  }, [registrations]);

  const phoneGroups = groupRegistrationsByPhone();

  const data = useDeepCompareMemo(() => 
    registrations.flatMap(registration => 
      registration.order.customFieldValues.map(group => {
        const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));
        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || field.type === 'phone'
        );
        const walkField = group.fields.find(field => 
          field.label.toLowerCase().includes('walk')
        );
        const phoneNumber = phoneField ? phoneField.value : '';
        const isDuplicate = isSuperAdmin && phoneGroups[phoneNumber] && phoneGroups[phoneNumber].length > 1;
        const cannotWalk = walkField && ['no', '否', 'false'].includes(walkField.value.toLowerCase());
        return {
          registrationId: registration.id,
          groupId: group.groupId,
          queueNumber: group.queueNumber || '',
          name: nameField ? nameField.value : 'N/A',
          phoneNumber,
          isDuplicate,
          cannotWalk,
          attendance: !!group.attendance,
          cancelled: !!group.cancelled,
          remarks: taggedUsers[phoneNumber] || '',
        };
      })
    ),
    [registrations, phoneGroups, isSuperAdmin, taggedUsers]
  );

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'queueNumber', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a: AttendanceItem, b: AttendanceItem) => {
        if ((a[sortConfig.key] ?? '') < (b[sortConfig.key] ?? '')) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if ((a[sortConfig.key] ?? '') > (b[sortConfig.key] ?? '')) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const requestSort = (key: keyof AttendanceItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderHeader = (label: string, key: keyof AttendanceItem) => (
    <th className="py-2 px-4 border-b text-left">
      <Button
        variant="ghost"
        onClick={() => requestSort(key)}
      >
        {label}
        {sortConfig.key === key && (sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽')}
      </Button>
    </th>
  );

  // Optimize checkbox handling for mobile
  const handleCheckboxChange = useCallback((registrationId: string, groupId: string, checked: boolean) => {
    handleMarkAttendance(registrationId, groupId, checked);
  }, [handleMarkAttendance]);

  return (
    <div className="wrapper my-8">
      <AttendanceDetailsCard 
        event={event}
        totalRegistrations={totalRegistrations}
        attendedUsersCount={attendedUsersCount}
        cannotReciteAndWalkCount={cannotReciteAndWalkCount}
      />

      <div className="mt-8">
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
        
        {/* Notes section */}
        <div className="mb-4 space-y-2">
          <p className="p-2 bg-orange-100 text-sm">
            Rows highlighted in light orange indicate participants who cannot walk and recite.
            <br />
            橙色突出显示的行表示无法行走和诵经的参与者。
          </p>
          {isSuperAdmin && (
            <p className="p-2 bg-red-100 text-sm">
              Rows highlighted in light red indicate registrations with the same phone number.
              <br />
              浅红色突出显示的行表示具有相同电话号码的注册。
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                {renderHeader('Queue Number 排队号码', 'queueNumber')}
                {renderHeader('Name 姓名', 'name')}
                {isSuperAdmin && renderHeader('Phone Number 电话号码', 'phoneNumber')}
                <th className="py-2 px-4 border-b text-left">Remarks 备注</th>
                <th className="py-2 px-4 border-b text-left">Attendance 出席</th>
                {isSuperAdmin && (
                  <>
                    <th className="py-2 px-4 border-b text-left">Cancelled 已取消</th>
                    <th className="py-2 px-4 border-b text-left">Delete 删除</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr 
                  key={`${row.registrationId}_${row.groupId}`}
                  className={`
                    hover:bg-gray-50 
                    ${isSuperAdmin && row.isDuplicate ? 'bg-red-100' : ''}
                    ${row.cannotWalk ? 'bg-orange-100' : ''}
                  `}
                >
                  <td className="py-2 px-4 border-b text-left">{row.queueNumber}</td>
                  <td className="py-2 px-4 border-b text-left">{row.name}</td>
                  {isSuperAdmin && <td className="py-2 px-4 border-b text-left">{row.phoneNumber}</td>}
                  <td className="py-2 px-4 border-b text-left">{row.remarks}</td>
                  <td className="py-2 px-4 border-b text-left">
                    <Checkbox
                      checked={row.attendance}
                      onCheckedChange={(checked) => handleCheckboxChange(row.registrationId, row.groupId, checked as boolean)}
                    />
                  </td>
                  {isSuperAdmin && (
                    <>
                      <td className="py-2 px-4 border-b text-left">
                        <Checkbox
                          checked={row.cancelled}
                          onCheckedChange={(checked) => handleCancelRegistration(row.registrationId, row.groupId, row.queueNumber, checked as boolean)}
                        />
                      </td>
                      <td className="py-2 px-4 border-b text-left">
                        <button
                          onClick={() => handleDeleteRegistration(row.registrationId, row.groupId, row.queueNumber)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Image src="/assets/icons/delete.svg" alt="delete" width={20} height={20} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              {'<<'}
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              {'<'}
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              {'>'}
            </Button>
            <Button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              {'>>'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            
            <span className="flex items-center gap-1">
              <span className="whitespace-nowrap">Go to:</span>
              <Input
                type="number"
                value={currentPage}
                onChange={e => {
                  const page = Math.max(1, Math.min(Number(e.target.value), totalPages));
                  setCurrentPage(page);
                }}
                className="w-16"
              />
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded p-1"
            >
              {[10, 20, 30, 40, 50].map(size => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}

        {showModal && (
          <Modal>
            <p>{modalMessage}</p>
          </Modal>
        )}

        {showDeleteConfirmation && deleteConfirmationData && (
          <Modal>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Confirm Deletion / 确认删除</h3>
              <p className="mb-4">Are you sure you want to delete the registration for queue number {deleteConfirmationData.queueNumber}?</p>
              <p className="mb-4">您确定要删除队列号 {deleteConfirmationData.queueNumber} 的注册吗？</p>
              <div className="flex justify-end space-x-4">
                <Button onClick={() => setShowDeleteConfirmation(false)} variant="outline">
                  Cancel / 取消
                </Button>
                <Button onClick={confirmDeleteRegistration} variant="destructive">
                  Delete / 删除
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
});

export default AttendanceClient;