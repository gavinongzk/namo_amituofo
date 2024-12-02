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
import { Loader2 } from 'lucide-react';
import QrCodeScanner from '@/components/shared/QrCodeScanner';
import DownloadCsvButton from '@/components/shared/DownloadCsvButton';
import { cn } from "@/lib/utils";

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
  const [modalTitle, setModalTitle] = useState('');
  const [attendedUsersCount, setAttendedUsersCount] = useState(0);
  const { user } = useUser();
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationData, setDeleteConfirmationData] = useState<{ registrationId: string; groupId: string; queueNumber: string } | null>(null);
  const [cannotReciteAndWalkCount, setCannotReciteAndWalkCount] = useState(0);
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';
  const [taggedUsers, setTaggedUsers] = useState<Record<string, string>>({});
  const [showScanner, setShowScanner] = useState(false);
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const lastScanTime = useRef<number>(0);
  const [showAlreadyMarkedModal, setShowAlreadyMarkedModal] = useState(false);
  const [alreadyMarkedQueueNumber, setAlreadyMarkedQueueNumber] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(100);  // Default to 100 rows per page
  const [modalType, setModalType] = useState<'loading' | 'success' | 'error'>('loading');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    registrationId: string;
    groupId: string;
    queueNumber: string;
    currentAttendance: boolean;
    name: string; // Add name to confirmation data
  } | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({}); // Store remarks by registrationId
  const [cancelledUsersCount, setCancelledUsersCount] = useState(0);


  const calculateCounts = useCallback((registrations: EventRegistration[]) => {
    let total = 0;
    let attended = 0;
    let cannotReciteAndWalk = 0;
    let cancelled = 0;

    registrations.forEach(registration => {
      registration.order.customFieldValues.forEach(group => {
        if (!group.cancelled) {
          total += 1;
          if (group.attendance) attended += 1;
          const walkField = group.fields.find(field => field.label.toLowerCase().includes('walk'));
          if (walkField && ['no', '否', 'false'].includes(walkField.value.toLowerCase())) {
            cannotReciteAndWalk += 1;
          }
        } else {
          cancelled += 1;
        }
      });
    });

    setTotalRegistrations(total);
    setAttendedUsersCount(attended);
    setCannotReciteAndWalkCount(cannotReciteAndWalk);
    setCancelledUsersCount(cancelled);
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

  const showModalWithMessage = useCallback((title: string, message: string, type: 'loading' | 'success' | 'error') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);

    // Auto-close the modal after 2 seconds for success and error messages
    if (type !== 'loading') {
      setTimeout(() => {
        setShowModal(false);
        setModalType('loading'); // Reset for next use
      }, 2000);
    }
  }, []);

  const handleMarkAttendance = useCallback(async (registrationId: string, groupId: string, attended: boolean) => {
    showModalWithMessage('Updating / 更新中', 'Updating attendance... 更新出席情况...', 'loading');

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

        showModalWithMessage(
          'Success / 成功', 
          `Attendance ${attended ? 'marked' : 'unmarked'} successfully\n出席情况${attended ? '已标记' : '已取消标记'}`,
          'success'
        );

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
      showModalWithMessage('Error / 错误', 'Failed to update attendance. 更新出席情况失败。', 'error');
    }
  }, [event._id, registrations, calculateCounts, showModalWithMessage]);

  const handleQueueNumberSubmit = useCallback(async () => {
    const registration = registrations.find(r => r.order.customFieldValues.some(group => group.queueNumber === queueNumber));
    if (registration) {
      const group = registration.order.customFieldValues[0];
      if (group) {
        const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));
        setConfirmationData({
          registrationId: registration.id,
          groupId: group.groupId,
          queueNumber: group.queueNumber || '',
          currentAttendance: !!group.attendance,
          name: nameField ? nameField.value : 'N/A' // Set name in confirmation data
        });
        setShowConfirmation(true);
      }
    } else {
      setMessage('Registration not found with this queue number. 未找到此排队号码的注册。');
    }
  }, [queueNumber, registrations]);

  const handleConfirmAttendance = useCallback(async () => {
    if (confirmationData) {
      await handleMarkAttendance(confirmationData.registrationId, confirmationData.groupId, !confirmationData.currentAttendance);
      setQueueNumber('');
      setShowConfirmation(false);
    }
  }, [confirmationData, handleMarkAttendance]);

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

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phoneNumber.includes(searchText)
    );
  }, [data, searchText]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
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
  }, [filteredData, sortConfig]);

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
    <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100 whitespace-normal">
      <Button
        variant="ghost"
        onClick={() => requestSort(key)}
        className="hover:bg-gray-200 transition-colors duration-200 w-full text-left p-0"
      >
        <span className="block text-xs">{label}</span>
        {sortConfig.key === key && (
          <span className="ml-1">
            {sortConfig.direction === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </Button>
    </th>
  );

  // Optimize checkbox handling for mobile
  const handleCheckboxChange = useCallback((registrationId: string, groupId: string, checked: boolean) => {
    handleMarkAttendance(registrationId, groupId, checked);
  }, [handleMarkAttendance]);

  const handleScan = useCallback((decodedText: string) => {
    const now = Date.now();
    if (now - lastScanTime.current < 1500) { // 1.5 seconds cooldown
      return;
    }
    lastScanTime.current = now;


    const [scannedEventId, queueNumber] = decodedText.split('_');

    if (scannedEventId === event._id) {
      const registration = registrations.find(r => 
        r.order.customFieldValues.some(group => group.queueNumber === queueNumber)
      );

      if (registration) {
        const group = registration.order.customFieldValues.find(g => g.queueNumber === queueNumber);
        if (group) {
          if (!group.attendance) {
            handleMarkAttendance(registration.id, group.groupId, true);
            new Audio('/assets/sounds/success-beep.mp3').play().catch(e => console.error('Error playing audio:', e));
            showModalWithMessage(
              'Success / 成功',
              `Marked attendance for: ${queueNumber}\n为队列号 ${queueNumber} 标记出席`,
              'success'
            );
            setRecentScans(prev => [queueNumber, ...prev.slice(0, 4)]);
          } else {
            showModalWithMessage(
              'Already Marked / 已标记',
              `Attendance already marked for: ${queueNumber}\n队列号 ${queueNumber} 的出席已经被标记`,
              'error'
            );
            setRecentScans(prev => [queueNumber, ...prev.slice(0, 4)]);
          }
        }
      } else {
        showModalWithMessage(
          'Error / 错误',
          `Registration not found for: ${queueNumber}\n未找到队列号 ${queueNumber} 的注册`,
          'error'
        );
      }
    } else {
      showModalWithMessage(
        'Error / 错误',
        'Invalid QR code for this event\n此活动的二维码无效',
        'error'
      );
    }
  }, [event._id, registrations, handleMarkAttendance, showModalWithMessage]);

  const handleUpdateRemarks = async (registrationId: string, phoneNumber: string, name: string) => {
    const remark = remarks[registrationId]; // Get the remark for the specific registrationId
    try {
        await fetch('/api/tagged-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, name, remarks: remark }), // Allow empty remarks
        });
        // Update the local remarks state immediately after saving
        setRemarks((prev) => ({ ...prev, [registrationId]: remark })); // Update the remarks for the specific registrationId
        
        // Show success modal after saving remarks
        showModalWithMessage('Success / 成功', 'Remarks saved successfully. 备注已成功保存。', 'success');
    } catch (error) {
        console.error('Error updating remarks:', error);
    }
  };

  const handleUpdateMaxSeats = useCallback(async (newMaxSeats: number) => {
    showModalWithMessage('Updating / 更新中', 'Updating max seats... 更新最大座位数...', 'loading');

    try {
      const response = await fetch(`/api/events/${event._id}/max-seats`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxSeats: newMaxSeats }),
      });

      if (!response.ok) {
        throw new Error('Failed to update max seats');
      }

      // Update the event object locally
      event.maxSeats = newMaxSeats;

      showModalWithMessage(
        'Success / 成功',
        'Max seats updated successfully\n最大座位数已更新',
        'success'
      );
    } catch (error) {
      console.error('Error updating max seats:', error);
      showModalWithMessage(
        'Error / 错误',
        'Failed to update max seats\n更新最大座位数失败',
        'error'
      );
    }
  }, [event, showModalWithMessage]);

  return (
    <div className="wrapper my-8">
      <AttendanceDetailsCard 
        event={event}
        totalRegistrations={totalRegistrations}
        attendedUsersCount={attendedUsersCount}
        cannotReciteAndWalkCount={cannotReciteAndWalkCount}
        cancelledUsersCount={cancelledUsersCount}
        isSuperAdmin={isSuperAdmin}
        onUpdateMaxSeats={handleUpdateMaxSeats}
      />

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
          <Input
            placeholder="Enter Queue Number 输入排队号码"
            value={queueNumber}
            onChange={(e) => setQueueNumber(e.target.value)}
            className="flex-grow text-lg p-3"
          />
          <Button 
            onClick={handleQueueNumberSubmit} 
            className="bg-blue-500 text-white text-lg p-3 w-full sm:w-auto"
          >
            Mark Attendance 标记出席
          </Button>
          <Button
            onClick={() => setShowScanner(!showScanner)}
            className="bg-green-500 text-white text-lg p-3 w-full sm:w-auto"
          >
            {showScanner ? 'Hide Scanner' : 'Scan QR Code'}
          </Button>
          {isSuperAdmin && (
            <div className="w-full sm:w-auto">
              <DownloadCsvButton 
                eventId={event._id} 
                searchText={searchText}
              />
            </div>
          )}
        </div>

        {showScanner && (
          <div className="mb-6">
            <QrCodeScanner onScan={handleScan} />
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Recent Scans:</h4>
              <ul className="list-disc pl-5">
                {recentScans.map((scan, index) => (
                  <li key={index}>{scan}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <h4 className="text-xl font-bold mb-4">Registered Users 注册用户</h4>
        
        {/* Search input */}
        <div className="mb-4">
          <Input
            placeholder="Search by name or phone number 按姓名或电话号码搜索"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full text-lg p-3"
          />
        </div>

        <div className="overflow-x-auto mt-6 border border-gray-200 rounded-lg shadow">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  {renderHeader('Queue\n排队号', 'queueNumber')}
                  {renderHeader('Name\n姓名', 'name')}
                  {isSuperAdmin && renderHeader('Phone\n电话', 'phoneNumber')}
                  <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                    <span className="block text-xs">Remarks<br/>备注</span>
                  </th>
                  <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                    <span className="block text-xs">Attendance<br/>出席</span>
                  </th>
                  {isSuperAdmin && (
                    <>
                      <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                        <span className="block text-xs">Cancelled<br/>已取消</span>
                      </th>
                      <th className="py-2 px-3 border-b text-left font-semibold text-gray-700 bg-gray-100">
                        <span className="block text-xs">Delete<br/>删除</span>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr 
                    key={`${row.registrationId}_${row.groupId}`}
                    className={`
                      hover:bg-gray-50 transition-colors duration-150
                      ${isSuperAdmin && row.isDuplicate && row.cannotWalk ? 'bg-blue-50' : 
                        isSuperAdmin && row.isDuplicate ? 'bg-green-50' : 
                        row.cannotWalk ? 'bg-orange-50' : ''}
                    `}
                  >
                    <td className="py-3 px-4 border-b border-r whitespace-normal">{row.queueNumber}</td>
                    <td className="py-3 px-4 border-b border-r">{row.name}</td>
                    {isSuperAdmin && <td className="py-3 px-4 border-b border-r whitespace-normal">{row.phoneNumber}</td>}
                    <td className="py-3 px-4 border-b border-r">
                      {isSuperAdmin ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={remarks[row.registrationId] !== undefined ? remarks[row.registrationId] : row.remarks}
                            onChange={(e) => setRemarks((prev) => ({ ...prev, [row.registrationId]: e.target.value }))}
                            className="h-8 text-sm min-w-[120px]"
                            placeholder="Add remarks"
                          />
                          <Button
                            onClick={() => handleUpdateRemarks(row.registrationId, row.phoneNumber, row.name)}
                            className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm"
                            size="sm"
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700">{row.remarks || '—'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 border-b border-r">
                      <Checkbox
                        checked={row.attendance}
                        onCheckedChange={(checked) => handleCheckboxChange(row.registrationId, row.groupId, checked as boolean)}
                      />
                    </td>
                    {isSuperAdmin && (
                      <>
                        <td className="py-3 px-4 border-b border-r">
                          <Checkbox
                            checked={row.cancelled}
                            onCheckedChange={(checked) => handleCancelRegistration(row.registrationId, row.groupId, row.queueNumber, checked as boolean)}
                          />
                        </td>
                        <td className="py-3 px-4 border-b">
                          <button
                            onClick={() => handleDeleteRegistration(row.registrationId, row.groupId, row.queueNumber)}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
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
          )}
        </div>

        {/* Pagination controls */}
        {!isLoading && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
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
                {[100, 200, 300].map(size => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}

        {/* Notes section moved here */}
        <div className="mt-6 space-y-2">
          <p className="p-2 bg-orange-100 text-sm">
            Rows highlighted in light orange indicate participants who cannot walk and recite.
            <br />
            橙色突出显示的行表示无法绕佛者。
          </p>
          {isSuperAdmin && (
            <>
              <p className="p-2 bg-green-100 text-sm">
                Rows highlighted in light green indicate registrations with the same phone number.
                <br />
                浅绿色突出显示的行表示具有相同电话号码的注册。
              </p>
              <p className="p-2 bg-blue-100 text-sm">
                Rows highlighted in light blue indicate participants who cannot walk and recite AND have duplicate phone numbers.
                <br />
                浅蓝色突出显示的行表示无法绕佛且具有重复电话号码的参与者。
              </p>
            </>
          )}
        </div>

        {showModal && (
          <Modal>
            <div className={cn(
              "p-6 rounded-lg",
              modalType === 'success' ? 'bg-green-100' : 
              modalType === 'error' ? 'bg-red-100' : 'bg-white'
            )}>
              <h3 className={cn(
                "text-lg font-semibold mb-4",
                modalType === 'success' ? 'text-green-800' : 
                modalType === 'error' ? 'text-red-800' : 'text-gray-900'
              )}>
                {modalTitle}
              </h3>
              <p className={cn(
                "mb-4 whitespace-pre-line",
                modalType === 'success' ? 'text-green-700' : 
                modalType === 'error' ? 'text-red-700' : 'text-gray-700'
              )}>
                {modalMessage}
              </p>
              {modalType === 'loading' && (
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setShowModal(false)} 
                    variant="outline"
                  >
                    Close / 关闭
                  </Button>
                </div>
              )}
            </div>
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

        {showAlreadyMarkedModal && (
          <Modal>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Attendance Already Marked</h3>
              <p className="mb-4">
                Attendance for queue number {alreadyMarkedQueueNumber} has already been marked.
              </p>
              <p className="mb-4">
                队列号 {alreadyMarkedQueueNumber} 的出席已经被标记。
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setShowAlreadyMarkedModal(false)} variant="outline">
                  Close / 关闭
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {showConfirmation && confirmationData && (
          <Modal>
            <div className="p-6 bg-white rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Confirm Attendance Change / 确认出席变更</h3>
              <p className="mb-4">
                {confirmationData.currentAttendance
                  ? `Unmark attendance for ${confirmationData.name} | queue number ${confirmationData.queueNumber}?`
                  : `Mark attendance for ${confirmationData.name} | queue number ${confirmationData.queueNumber}?`}
              </p>
              <p className="mb-4">
                {confirmationData.currentAttendance
                  ? `您确定要取消标记 ${confirmationData.name} | 队列号 ${confirmationData.queueNumber} 的出席吗？`
                  : `您确定要标记 ${confirmationData.name} | 队列号 ${confirmationData.queueNumber} 的出席吗？`}
              </p>
              <div className="flex justify-end space-x-4">
                <Button onClick={() => setShowConfirmation(false)} variant="outline">
                  Cancel / 取消
                </Button>
                <Button onClick={handleConfirmAttendance} variant="default">
                  Confirm / 确认
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
