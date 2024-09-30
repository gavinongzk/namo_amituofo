'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [cannotReciteAndWalkCount, setCannotReciteAndWalkCount] = useState(0);
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';

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

  const handleMarkAttendance = useCallback(async (registrationId: string, groupId: string, attended: boolean) => {
    console.log(`Marking attendance for registration ${registrationId}, group ${groupId}: ${attended}`);
    setShowModal(true);
    setModalMessage('Updating attendance... 更新出席情况...');

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
      } else {
        throw new Error('Failed to update attendance 更新出席情况失败');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Failed to update attendance. 更新出席情况失败。');
      setModalMessage('Failed to update attendance. 更新出席情况失败。');
    }

    setTimeout(() => {
      setShowModal(false);
    }, 2000);
  }, [event._id, registrations, setRegistrations, setAttendedUsersCount, setMessage, setModalMessage, setShowModal]);

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
        setModalMessage(cancelled 
          ? 'Registration cancelled successfully. Refreshing page... 已成功取消。正在刷新页面...' 
          : 'Registration uncancelled successfully. Refreshing page... 注册已成功恢复。正在刷新页面...'
        );
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(`Failed to ${cancelled ? 'cancel' : 'uncancel'} registration 操作失败`);
      }
    } catch (error) {
      console.error(`Error ${cancelled ? 'cancelling' : 'uncancelling'} registration:`, error);
      setModalMessage(`Failed to ${cancelled ? 'cancel' : 'uncancel'} registration. 操作失败。`);
    }

    // No need to hide the modal here as the page will refresh
  }, []);

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
        setRegistrations(prevRegistrations =>
          prevRegistrations.map(r => {
            if (r.id === registrationId) {
              const updatedCustomFieldValues = r.order.customFieldValues.filter(group => group.groupId !== groupId);
              return { ...r, order: { ...r.order, customFieldValues: updatedCustomFieldValues } };
            }
            return r;
          })
        );
        setMessage(`Registration deleted for ${registrationId}, group ${groupId}`);
        setModalMessage(`Registration deleted for queue number ${queueNumber}`);
        
        // Update total registrations count
        setTotalRegistrations(prev => prev - 1);
        
        // Update attended users count if the deleted registration was marked as attended
        const deletedRegistration = registrations.find(r => r.id === registrationId);
        const deletedGroup = deletedRegistration?.order.customFieldValues.find(g => g.groupId === groupId);
        if (deletedGroup?.attendance) {
          setAttendedUsersCount(prev => prev - 1);
        }
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
  }, [deleteConfirmationData, registrations, setRegistrations, setMessage, setModalMessage, setTotalRegistrations, setAttendedUsersCount]);

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

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch(`/api/events/${event._id}/counts`);
        if (res.ok) {
          const data = await res.json();
          setTotalRegistrations(data.totalRegistrations);
          setAttendedUsersCount(data.attendedUsers);
          setCannotReciteAndWalkCount(data.cannotReciteAndWalk);
        } else {
          console.error('Failed to fetch counts:', await res.text());
        }
      } catch (error) {
        console.error('Error fetching registration counts:', error);
      }
    };

    fetchCounts();
  }, [event._id]);

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor('queueNumber', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Queue Number 排队号码
            {{
              asc: ' 🔼',
              desc: ' 🔽',
            }[column.getIsSorted() as string] ?? null}
          </Button>
        ),
        cell: info => info.getValue() || 'N/A',
      }),
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name 姓名
            {{
              asc: ' 🔼',
              desc: ' 🔽',
            }[column.getIsSorted() as string] ?? null}
          </Button>
        ),
        cell: info => info.getValue() || 'N/A',
      }),
      // ... other common columns ...
    ];

    if (isSuperAdmin) {
      baseColumns.splice(2, 0, columnHelper.accessor('phoneNumber', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Phone Number 电话号码
            {{
              asc: ' 🔼',
              desc: ' 🔽',
            }[column.getIsSorted() as string] ?? null}
          </Button>
        ),
        cell: info => info.getValue() || 'N/A',
      }));
    }

    return baseColumns;
  }, [isSuperAdmin]);

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
          ...(isSuperAdmin && { phoneNumber }),
          isDuplicate,
          cannotWalk,
          attendance: !!group.attendance,
          cancelled: !!group.cancelled,
        };
      })
    ),
    [registrations, phoneGroups, isSuperAdmin]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'queueNumber', desc: false }],
    },
    state: {
      sorting: sorting,
    },
    onSortingChange: setSorting,
  });

  if (isLoading) {
    return <p>Loading... 加载中...</p>;
  }

  if (registrations.length === 0) {
    return <p>No registrations found for this event. 未找到此活动的注册。</p>;
  }

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
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-gray-100">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="py-2 px-4 border-b text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  className={`
                    hover:bg-gray-50 
                    ${isSuperAdmin && row.original.isDuplicate ? 'bg-red-100' : ''}
                    ${row.original.cannotWalk ? 'bg-orange-100' : ''}
                  `}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="py-2 px-4 border-b text-left">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </Button>
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </Button>
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </Button>
          <Button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </Button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            | Go to page:
            <Input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={e => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                table.setPageIndex(page)
              }}
              className="border p-1 rounded w-16"
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
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

      {isSuperAdmin && (
        <p className="mt-4 text-sm text-gray-600">
          Note: Rows highlighted in light red indicate registrations with the same phone number. 
          Rows highlighted in light orange indicate participants who cannot walk and recite.
        </p>
      )}
    </div>
  );
});

export default AttendanceClient;