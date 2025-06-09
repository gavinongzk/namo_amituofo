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
import { cn, prepareRegistrationIdentifiers } from "@/lib/utils";
import QrCodeWithLogo from '@/components/shared/QrCodeWithLogo';
import FloatingNavigation from '@/components/shared/FloatingNavigation';
import crypto from 'crypto';

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
  postalCode: string;
}

interface SortConfig {
  key: keyof AttendanceItem;
  direction: 'asc' | 'desc';
}

const AttendanceClient = React.memo(({ event }: { event: Event }) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  // State for basic UI controls
  const [queueNumber, setQueueNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalType, setModalType] = useState<'loading' | 'success' | 'error'>('loading');
  const [searchText, setSearchText] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(100);  // Default to 100 rows per page
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State for attendance tracking
  const [attendedUsersCount, setAttendedUsersCount] = useState<number>(0);
  const [totalRegistrations, setTotalRegistrations] = useState<number>(0);
  const [cannotReciteAndWalkCount, setCannotReciteAndWalkCount] = useState<number>(0);
  const [cancelledUsersCount, setCancelledUsersCount] = useState<number>(0);
  const [beepHistory] = useState<Set<string>>(new Set()); // Track which queue numbers have already beeped

  // State for remarks handling
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [modifiedRemarks, setModifiedRemarks] = useState<Set<string>>(new Set());
  const [taggedUsers, setTaggedUsers] = useState<Record<string, string>>({});

  // State for modals and confirmations
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [deleteConfirmationData, setDeleteConfirmationData] = useState<{ registrationId: string; groupId: string; queueNumber: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [confirmationData, setConfirmationData] = useState<{
    registrationId: string;
    groupId: string;
    queueNumber: string;
    currentAttendance: boolean;
    name: string;
  } | null>(null);

  // State for QR scanner
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [recentScans, setRecentScans] = useState<Array<{ queueNumber: string; name: string }>>([]);
  const [showAlreadyMarkedModal, setShowAlreadyMarkedModal] = useState<boolean>(false);
  const [alreadyMarkedQueueNumber, setAlreadyMarkedQueueNumber] = useState<string>('');
  const lastScanTime = useRef<number>(0);

  // Add auto-refresh functionality - start disabled to prevent hydration issues
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // User and permissions
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';

  // State for export functionality
  const [isExporting, setIsExporting] = useState(false);


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
        const mappedAttendees = data.attendees.map((registration: EventRegistration) => ({
          ...registration,
          order: {
            ...registration.order,
            customFieldValues: registration.order.customFieldValues.map((group) => ({
              ...group,
              cancelled: group.cancelled || false
            }))
          }
        }));
        // Only update if changed
        setRegistrations(prev => {
          if (!isEqual(prev, mappedAttendees)) {
            return mappedAttendees;
          }
          return prev;
        });
        // Calculate attended count from API data
        const attendedCount = data.attendees.reduce((count: number, registration: EventRegistration) => {
          return count + registration.order.customFieldValues.filter(group =>
            group.attendance && !group.cancelled
          ).length;
        }, 0);
        setAttendedUsersCount(attendedCount);
      } else {
        setRegistrations([]);
        setAttendedUsersCount(0);
        setMessage('No registrations found for this event. 未找到此活动的报名。');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setMessage('Failed to fetch registrations. 获取报名失败。');
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

  // Enable auto-refresh after component mounts to prevent hydration issues
  useEffect(() => {
    // Initialize auto-refresh and timestamp on client-side only
    setAutoRefreshEnabled(true);
    setLastRefreshTime(Date.now());
  }, []);

  // Auto-refresh effect to periodically fetch new registrations
  useEffect(() => {
    if (autoRefreshEnabled) {
      // Refresh more frequently when QR scanner is active for better UX
      const refreshInterval = showScanner ? 10000 : 15000; // 10s when scanner active, 15s otherwise
      
      const interval = setInterval(() => {
        setLastRefreshTime(Date.now());
        fetchRegistrations();
      }, refreshInterval);
      autoRefreshIntervalRef.current = interval;

      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
          autoRefreshIntervalRef.current = null;
        }
      };
    }
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, showScanner, fetchRegistrations]);

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
    console.log(`Marking attendance for registration ${registrationId}, group ${groupId}: ${attended}`);
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
              const updatedCustomFieldValues = r.order.customFieldValues.map(g => {
                if (g.groupId === groupId) {
                  return { ...g, attendance: attended };
                }
                return g;
              });
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
        const errorData = await res.json();
        if (errorData.error === 'CANCELLED_REGISTRATION') {
          showModalWithMessage(
            'Error / 错误', 
            'Cannot mark attendance for cancelled registration. Please uncancel the registration first.\n无法为已取消的报名标记出席。请先取消取消状态。',
            'error'
          );
        } else {
          throw new Error(errorData.message || 'Failed to update attendance 更新出席情况失败');
        }
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      showModalWithMessage('Error / 错误', 'Failed to update attendance. 更新出席情况失败。', 'error');
    }
  }, [event._id, registrations, calculateCounts, showModalWithMessage, fetchRegistrations]);

  const handleQueueNumberSubmit = useCallback(async () => {
    console.log('Submitting queue number:', queueNumber);
    const registration = registrations.find(r => r.order.customFieldValues.some(group => group.queueNumber === queueNumber));
    if (registration) {
      const group = registration.order.customFieldValues.find(g => g.queueNumber === queueNumber);
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
      setMessage('Registration not found with this queue number. 未找到此排队号码的报名。');
      console.log('Registration not found with this queue number:', queueNumber);
    }
  }, [queueNumber, registrations]);

  // New function to handle queue number input and show participant name immediately
  const handleQueueNumberChange = useCallback((value: string) => {
    setQueueNumber(value);
    
    // Clear previous message
    setMessage('');
    
    // If queue number is entered, try to find and display the participant name
    if (value.trim()) {
      const registration = registrations.find(r => 
        r.order.customFieldValues.some(group => group.queueNumber === value.trim())
      );
      
      if (registration) {
        const group = registration.order.customFieldValues.find(g => g.queueNumber === value.trim());
        if (group) {
          const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));
          const participantName = nameField ? nameField.value : 'N/A';
          const attendanceStatus = group.attendance ? '已出席 (Attended)' : '未出席 (Not Attended)';
          const cancelledStatus = group.cancelled ? '已取消 (Cancelled)' : '有效 (Active)';
          
          setMessage(`找到参加者 Found: ${participantName} - ${attendanceStatus} - ${cancelledStatus}`);
        }
      } else {
        setMessage('未找到此排队号码的报名 Registration not found with this queue number');
      }
    }
  }, [registrations]);

  const handleConfirmAttendance = useCallback(async () => {
    if (confirmationData) {
      await handleMarkAttendance(confirmationData.registrationId, confirmationData.groupId, !confirmationData.currentAttendance);
      setQueueNumber('');
      setShowConfirmation(false);
    }
  }, [confirmationData, handleMarkAttendance]);

  const handleCancelRegistration = useCallback(async (registrationId: string, groupId: string, queueNumber: string, cancelled: boolean) => {
    setShowModal(true);
    setModalMessage(cancelled ? 'Cancelling registration... 取消报名中...' : 'Uncancelling registration... 恢复报名中...');

    try {
      // Extract orderId from registrationId, but we'll prioritize eventId and queueNumber
      const [orderId] = registrationId.split('_');
      
      // Require queueNumber for operation
      if (!queueNumber) {
        setModalMessage('Cannot proceed: missing queue number');
        console.error('Cannot cancel/uncancel registration: queueNumber is required');
        
        setTimeout(() => {
          setShowModal(false);
          setMessage('Cannot cancel/uncancel: missing queue number');
        }, 2000);
        
        return;
      }

      // Require eventId
      if (!event._id) {
        setModalMessage('Cannot proceed: missing event ID');
        console.error('Cannot cancel/uncancel registration: eventId is required');
        
        setTimeout(() => {
          setShowModal(false);
          setMessage('Cannot cancel/uncancel: missing event ID');
        }, 2000);
        
        return;
      }

      console.log(`Attempting to ${cancelled ? 'cancel' : 'uncancel'} registration:`, {
        orderId,
        groupId,
        queueNumber,
        eventId: event._id,
        cancelled: Boolean(cancelled) // Ensure it's a proper boolean
      });

      // Create request data prioritizing eventId and queueNumber
      // We'll still include orderId as a fallback
      const requestData = { 
        eventId: event._id, // Primary identifier - the event
        queueNumber,        // Primary identifier - the specific registration
        orderId,            // Include as supplementary information
        groupId,            // Include as supplementary information
        cancelled: Boolean(cancelled) // Ensure it's a proper boolean
      };
      
      console.log(`Using eventId ${event._id} and queueNumber ${queueNumber} as primary identifiers`);
      
      // Try the main endpoint first
      try {
        const res = await fetch('/api/cancel-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!res.ok) {
          // If the main endpoint returns a 404, try the alternative endpoint
          if (res.status === 404) {
            console.log('Main endpoint returned 404, trying alternative endpoint');
            
            const altRes = await fetch('/api/cancel-registration-alt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
            });
            
            if (!altRes.ok) {
              throw new Error(`Alternative endpoint failed with status: ${altRes.status}`);
            }
            
            const data = await altRes.json();
            console.log(`Registration ${cancelled ? 'cancelled' : 'uncancelled'} successfully via alternative endpoint:`, data);
            
            // Check if returned queue number matches requested queue number
            if (queueNumber && data.queueNumber !== queueNumber) {
              console.warn(`API returned different queueNumber than requested: requested=${queueNumber}, returned=${data.queueNumber}`);
            }
            
            // Rest of the code remains the same...
            
            // Update state here
            // ...
            
            return; // Exit early since we handled via alternative endpoint
          } else {
            throw new Error(`API returned status code: ${res.status}`);
          }
        }
        
        const data = await res.json();
        console.log(`Registration ${cancelled ? 'cancelled' : 'uncancelled'} successfully:`, data);
        
        // Check if returned queue number matches requested queue number
        if (queueNumber && data.queueNumber !== queueNumber) {
          console.warn(`API returned different queueNumber than requested: requested=${queueNumber}, returned=${data.queueNumber}`);
        }
        
        // Verify the cancelled status was properly set as a boolean
        if (typeof data.cancelled !== 'boolean') {
          console.warn(`API returned non-boolean cancelled status: ${data.cancelled} (${typeof data.cancelled})`);
        }
        
        setMessage(`Registration ${cancelled ? 'cancelled' : 'uncancelled'} successfully for ${registrationId}, group ${groupId}`);
        setModalMessage(`Registration ${cancelled ? 'cancelled' : 'uncancelled'} successfully for queue number ${queueNumber}`);

        // Update registrations state with correct boolean value
        const updatedRegistrations = registrations.map(r => {
          if (r.id === registrationId) {
            return {
              ...r,
              order: {
                ...r.order,
                customFieldValues: r.order.customFieldValues.map(g => 
                  // Match precisely by queue number if provided, else fall back to groupId
                  (queueNumber && g.queueNumber === queueNumber) || g.groupId === groupId
                    ? { ...g, cancelled: Boolean(cancelled) }
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
      } catch (error) {
        console.error('Error cancelling/uncancelling registration:', error);
        setModalMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        setTimeout(() => {
          setShowModal(false);
          setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }, 2000);
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
    if (!deleteConfirmationData) {
      setMessage('No registration data provided');
      return;
    }

    const { registrationId, groupId, queueNumber } = deleteConfirmationData;
    setShowDeleteConfirmation(false);
    setShowModal(true);
    setModalMessage('Deleting registration... 删除报名中...');

    try {
      if (!event?._id) {
        throw new Error('Event ID is required');
      }

      if (!queueNumber) {
        throw new Error('Queue number is required');
      }

      const res = await fetch('/api/delete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event._id,
          queueNumber: queueNumber
        }),
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
        throw new Error('Failed to delete registration 删除报名失败');
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      setMessage('Failed to delete registration. 删除报名失败。');
      setModalMessage('Failed to delete registration. 删除报名失败。');
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
        const postalField = group.fields.find(field => field.type === 'postal');
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
          postalCode: postalField ? postalField.value : '',
        };
      })
    ),
    [registrations, phoneGroups, isSuperAdmin, taggedUsers]
  );

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'queueNumber', direction: 'asc' });

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

  const handleScan = useCallback(async (decodedText: string) => {
    const now = Date.now();
    // Debounce scans to prevent duplicates
    if (now - lastScanTime.current < 2000) {
      return;
    }
    lastScanTime.current = now;

    // Extract event ID, queue number and registration hash from QR code
    const [eventId, queueNumber, registrationHash] = decodedText.split('_');
    if (!eventId || !queueNumber || !registrationHash) {
      showModalWithMessage(
        'Error / 错误',
        'Invalid QR code format for this event\n此活动的二维码格式无效',
        'error'
      );
      return;
    }

    // Function to find registration by queue number and verify hash
    const findAndVerifyRegistration = (registrationsList: EventRegistration[]) => {
      return registrationsList.find(r => 
        r.order.customFieldValues.some(group => {
          const hasMatchingQueue = group.queueNumber === queueNumber;
          if (!hasMatchingQueue) return false;

          // Find phone number from fields
          const phoneField = group.fields.find(field => 
            field.label.toLowerCase().includes('phone') || 
            field.type === 'phone'
          );
          const phoneNumber = phoneField?.value || '';

          // Verify the registration hash
          const computedHash = crypto
            .createHash('sha256')
            .update(`${phoneNumber}_${queueNumber}_${eventId}`)
            .digest('hex')
            .slice(0, 16);

          return computedHash === registrationHash;
        })
      );
    };

    // Function to process a found registration
    const processRegistration = (registration: EventRegistration) => {
      const group = registration.order.customFieldValues.find(group => {
        const hasMatchingQueue = group.queueNumber === queueNumber;
        if (!hasMatchingQueue) return false;

        // Find phone number from fields
        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || 
          field.type === 'phone'
        );
        const phoneNumber = phoneField?.value || '';

        // Verify the registration hash
        const computedHash = crypto
          .createHash('sha256')
          .update(`${phoneNumber}_${queueNumber}_${eventId}`)
          .digest('hex')
          .slice(0, 16);

        return computedHash === registrationHash;
      });

      if (group) {
        const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));
        const name = nameField ? nameField.value : 'Unknown';

        // Only play beep and mark attendance if not already marked
        if (!group.attendance) {
          // Play beep sound once for unattended registrations
          new Audio('/assets/sounds/success-beep.mp3').play().catch(e => console.error('Error playing audio:', e));
          
          // Add to beep history to prevent future beeps for this QR code
          beepHistory.add(queueNumber);
          
          handleMarkAttendance(registration.id, group.groupId, true);
          showModalWithMessage(
            'Success / 成功',
            `Marked attendance for: ${name} (${queueNumber})\n为 ${name} (${queueNumber}) 标记出席`,
            'success'
          );
        
          setRecentScans(prev => {
            const filtered = prev.filter(scan => scan.queueNumber !== queueNumber);
            return [{ queueNumber, name }, ...filtered.slice(0, 4)];
          });
        } else {
          // No beep for already marked attendance
          showModalWithMessage(
            'Already Marked / 已标记',
            `Attendance already marked for: ${name} (${queueNumber})\n${name} (${queueNumber}) 的出席已经被标记`,
            'error'
          );
          setRecentScans(prev => {
            const filtered = prev.filter(scan => scan.queueNumber !== queueNumber);
            return [{ queueNumber, name }, ...filtered.slice(0, 4)];
          });
        }
      }
    };
    
    // First, try to find the registration in current data
    let registration = findAndVerifyRegistration(registrations);

    if (registration) {
      processRegistration(registration);
    } else {
      // If registration not found, try refreshing data and search again
      console.log('Registration not found, refreshing data and retrying...');
      showModalWithMessage(
        'Searching / 搜索中',
        `Searching for registration: ${queueNumber}\n搜索注册信息: ${queueNumber}`,
        'loading'
      );

      try {
        // Fetch fresh data from the API
        const response = await fetch(`/api/events/${event._id}/attendees`);
        if (!response.ok) {
          throw new Error('Failed to fetch fresh registrations');
        }
        const data = await response.json();
        
        if (Array.isArray(data.attendees)) {
          const freshRegistrations = data.attendees.map((registration: EventRegistration) => ({
            ...registration,
            order: {
              ...registration.order,
              customFieldValues: registration.order.customFieldValues.map((group) => ({
                ...group,
                cancelled: group.cancelled || false
              }))
            }
          }));

          // Search in fresh data
          const updatedRegistration = findAndVerifyRegistration(freshRegistrations);

          if (updatedRegistration) {
            console.log('Found registration after refresh, processing...');
            // Update the registrations state with fresh data
            setRegistrations(freshRegistrations);
            setLastRefreshTime(Date.now());
            
            // Process the found registration
            processRegistration(updatedRegistration);
          } else {
            showModalWithMessage(
              'Error / 错误',
              `Registration not found for: ${queueNumber}\n未找到队列号 ${queueNumber} 的报名`,
              'error'
            );
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error refreshing registrations:', error);
        showModalWithMessage(
          'Error / 错误',
          `Failed to refresh data. Registration not found for: ${queueNumber}\n刷新数据失败。未找到队列号 ${queueNumber} 的报名`,
          'error'
        );
      }
    }
  }, [registrations, handleMarkAttendance, showModalWithMessage, beepHistory, event._id]);

  const handleRemarkChange = useCallback((registrationId: string, value: string): void => {
    setRemarks((prev) => ({ ...prev, [registrationId]: value }));
    setModifiedRemarks((prev) => new Set(prev).add(registrationId));
  }, []); // No dependencies needed as we're only using setState functions

  const handleUpdateRemarks = useCallback(async (registrationId: string, phoneNumber: string, name: string): Promise<void> => {
    try {
      const remark = remarks[registrationId];
      await fetch('/api/tagged-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, name, remarks: remark }),
      });
      
      setModifiedRemarks(prev => {
        const next = new Set(prev);
        next.delete(registrationId);
        return next;
      });
      
      showModalWithMessage('Success / 成功', 'Remarks saved successfully. 备注已成功保存。', 'success');
    } catch (error) {
      console.error('Error updating remarks:', error);
      showModalWithMessage('Error / 错误', 'Failed to save remarks. 备注保存失败。', 'error');
    }
  }, [remarks, showModalWithMessage]);

  const handleSaveAllRemarks = useCallback(async (): Promise<void> => {
    showModalWithMessage('Saving / 保存中', 'Saving all modified remarks... 保存所有修改的备注...', 'loading');
    
    try {
      const promises = Array.from(modifiedRemarks).map((registrationId) => {
        const row = data.find(item => item.registrationId === registrationId);
        if (row) {
          return handleUpdateRemarks(registrationId, row.phoneNumber, row.name);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      showModalWithMessage('Success / 成功', 'All remarks saved successfully. 所有备注已成功保存。', 'success');
    } catch (error) {
      console.error('Error saving all remarks:', error);
      showModalWithMessage('Error / 错误', 'Failed to save all remarks. 备注保存失败。', 'error');
    }
  }, [modifiedRemarks, data, handleUpdateRemarks, showModalWithMessage]);

  // Event handler for input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>): void => {
    setter(e.target.value);
  }, []);

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

  const handleDownloadCsv = useCallback(() => {
    const queryParams = new URLSearchParams({
      eventId: event._id || '',
      searchText: searchText || '',
    }).toString();

    // Open the API route in a new window to trigger download
    window.open(`/api/download-csv?${queryParams}`, '_blank');
  }, [event._id, searchText]);

  const handleExportToSheets = useCallback(async () => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        eventId: event._id || '',
        searchText: searchText || '',
      }).toString();

      const response = await fetch(`/api/google-sheets?${queryParams}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export to Google Sheets');
      }

      const data = await response.json();
      if (data.success) {
        // Open the Google Sheets document in a new tab
        window.open(`https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`, '_blank');
        showModalWithMessage(
          'Success / 成功',
          'Successfully exported to Google Sheets\n成功导出到Google表格',
          'success'
        );
      }
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      showModalWithMessage(
        'Error / 错误',
        'Failed to export to Google Sheets\n导出到Google表格失败',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  }, [event._id, searchText, showModalWithMessage]);

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
        {/* Enhanced control panel for larger screens */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          {/* Queue number input section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Attendance / 快速出席
            </label>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Enter Queue Number 输入排队号码"
                  value={queueNumber}
                  onChange={(e) => handleQueueNumberChange(e.target.value)}
                  className="text-lg p-3 h-12"
                />
              </div>
              <Button 
                onClick={handleQueueNumberSubmit} 
                className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-6 h-12 min-w-[200px]"
              >
                Mark Attendance 标记出席
              </Button>
            </div>
          </div>

          {/* Action buttons grid for larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
            <Button
              onClick={() => setShowScanner(!showScanner)}
              className="bg-green-500 hover:bg-green-600 text-white h-12 flex items-center justify-center gap-2"
            >
              <span className="text-lg">📱</span>
              {showScanner ? 'Hide Scanner' : 'Scan QR Code'}
            </Button>
            
            <Button
              onClick={fetchRegistrations}
              className="bg-gray-500 hover:bg-gray-600 text-white h-12 flex items-center justify-center gap-2"
            >
              <span className="text-lg">🔄</span>
              Refresh 刷新
            </Button>
            
            <Button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`h-12 flex items-center justify-center gap-2 ${
                autoRefreshEnabled 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              <span className="text-lg">{autoRefreshEnabled ? '⏸️' : '▶️'}</span>
              {autoRefreshEnabled ? 'Disable Auto-Refresh' : 'Enable Auto-Refresh'}
            </Button>

            {isSuperAdmin && (
              <>
                <Button
                  onClick={handleDownloadCsv}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-12 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📊</span>
                  Download CSV
                </Button>
                
                <Button 
                  onClick={handleExportToSheets} 
                  className="bg-green-500 hover:bg-green-600 text-white h-12 flex items-center justify-center gap-2"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">📋</span>
                      Export to Sheets
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Auto-refresh status bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Auto-refresh: {autoRefreshEnabled ? 
                  `ON (every ${showScanner ? '10' : '15'} seconds${showScanner ? ' - Scanner Active' : ''})` : 
                  'OFF'
                }
              </span>
              {autoRefreshEnabled && lastRefreshTime > 0 && (
                <span className="text-gray-500">
                  Last refresh: {new Date(lastRefreshTime).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {message && (
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
                {message}
              </div>
            )}
          </div>
        </div>

        {showScanner && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <QrCodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Recent Scans
                </h4>
                <div className="space-y-2">
                  {recentScans.length > 0 ? (
                    recentScans.map((scan, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">{scan.name}</div>
                        <div className="text-gray-500">Queue: {scan.queueNumber}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm italic">No recent scans</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced header with search and controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <h4 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Registered Users 报名用户
            </h4>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-[300px]">
                <Input
                  placeholder="Search by name or phone number 按名字或电话号码搜索"
                  value={searchText}
                  onChange={(e) => handleInputChange(e, setSearchText)}
                  className="h-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-3 py-2 h-10 bg-white"
                >
                  {[100, 200, 300].map(size => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Enhanced pagination for larger screens */}
          {!isLoading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPage(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  title="First page & scroll to top"
                  className="h-8 px-3"
                >
                  {'<<'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  title="Previous page"
                  className="h-8 px-3"
                >
                  {'<'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  title="Next page"
                  className="h-8 px-3"
                >
                  {'>'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPage(totalPages);
                    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                  }}
                  disabled={currentPage === totalPages}
                  title="Last page & scroll to bottom"
                  className="h-8 px-3"
                >
                  {'>>'}
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Go to:</span>
                  <Input
                    type="number"
                    value={currentPage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const page = Math.max(1, Math.min(Number(e.target.value), totalPages));
                      setCurrentPage(page);
                    }}
                    className="w-16 h-8"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="h-8 px-3 text-xs"
                  title="Scroll to top"
                >
                  ↑ Top
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  className="h-8 px-3 text-xs"
                  title="Scroll to bottom"
                >
                  ↓ Bottom
                </Button>
              </div>
            </div>
          )}
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
                  {renderHeader('Queue 排队号', 'queueNumber')}
                  {renderHeader('Name 名字', 'name')}
                  {isSuperAdmin && renderHeader('Phone 电话', 'phoneNumber')}
                  {isSuperAdmin && renderHeader('Postal Code 邮区编号', 'postalCode')}
                  <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                    <span className="block text-xs">Remarks 备注</span>
                  </th>
                  <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                    <span className="block text-xs">Attendance 出席</span>
                  </th>
                  <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                    <span className="block text-xs">Cancelled 已取消</span>
                  </th>
                  {isSuperAdmin && (
                    <th className="py-2 px-3 border-b text-left font-semibold text-gray-700 bg-gray-100">
                      <span className="block text-xs">Delete 删除</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr 
                    key={`${row.registrationId}_${row.groupId}`}
                    className={`
                      hover:bg-gray-50 transition-colors duration-150
                      ${row.cancelled ? 'bg-red-50 line-through text-gray-500' :
                        (isSuperAdmin && row.isDuplicate) ? 'bg-green-50' : ''}
                    `}
                  >
                    <td className="py-3 px-4 border-b border-r whitespace-normal">{row.queueNumber}</td>
                    <td className="py-3 px-4 border-b border-r">{row.name}</td>
                    {isSuperAdmin && <td className="py-3 px-4 border-b border-r whitespace-normal">{row.phoneNumber}</td>}
                    {isSuperAdmin && <td className="py-3 px-4 border-b border-r whitespace-normal">{row.postalCode}</td>}
                    <td className="py-3 px-4 border-b border-r">
                      {isSuperAdmin ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={remarks[row.registrationId] !== undefined ? remarks[row.registrationId] : row.remarks}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRemarkChange(row.registrationId, e.target.value)}
                            className={cn(
                              "h-8 text-sm min-w-[120px]",
                              modifiedRemarks.has(row.registrationId) && "border-yellow-500"
                            )}
                            placeholder="Add remarks"
                          />
                          <Button
                            onClick={() => handleUpdateRemarks(row.registrationId, row.phoneNumber, row.name)}
                            className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm"
                            size="sm"
                            disabled={!modifiedRemarks.has(row.registrationId)}
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
                    <td className="py-3 px-4 border-b border-r">
                      <Checkbox
                        checked={row.cancelled}
                        onCheckedChange={(checked) => handleCancelRegistration(row.registrationId, row.groupId, row.queueNumber, checked as boolean)}
                      />
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3 px-4 border-b">
                        <button
                          onClick={() => handleDeleteRegistration(row.registrationId, row.groupId, row.queueNumber)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <Image src="/assets/icons/delete.svg" alt="delete" width={20} height={20} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
                      )}
          </div>

          {/* Bottom pagination controls */}
          {!isLoading && (
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setCurrentPage(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  title="First page & scroll to top"
                >
                  {'<<'}
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  {'<'}
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  title="Next page"
                >
                  {'>'}
                </Button>
                <Button
                  onClick={() => {
                    setCurrentPage(totalPages);
                    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                  }}
                  disabled={currentPage === totalPages}
                  title="Last page & scroll to bottom"
                >
                  {'>>'}
                </Button>
                <Button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                  title="Scroll to top"
                >
                  ↑ Top
                </Button>
                <Button
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                  title="Scroll to bottom"
                >
                  ↓ Bottom
                </Button>
              </div>

              {isSuperAdmin && modifiedRemarks.size > 0 && (
                <Button
                  onClick={handleSaveAllRemarks}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  Save All Modified Remarks ({modifiedRemarks.size})
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                
                <span className="flex items-center gap-1">
                  <span className="whitespace-nowrap">Go to:</span>
                  <Input
                    type="number"
                    value={currentPage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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

          {message && <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{message}</div>}

          {/* Floating Navigation */}
        <FloatingNavigation
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          position="bottom-right"
          showPagination={true}
          showScrollButtons={true}
        />

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
                浅绿色突出显示的行表示具有相同电话号码的报名。
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
              <p className="mb-4">您确定要删除队列号 {deleteConfirmationData.queueNumber} 的报名吗？</p>
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
