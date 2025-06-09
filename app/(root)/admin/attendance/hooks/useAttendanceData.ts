import { useState, useCallback, useEffect } from 'react';
import { isEqual } from 'lodash';
import { EventRegistration } from '../types/attendance';

interface UseAttendanceDataProps {
  eventId: string;
}

interface AttendanceStats {
  totalRegistrations: number;
  attendedUsersCount: number;
  cannotReciteAndWalkCount: number;
  cancelledUsersCount: number;
}

export const useAttendanceData = ({ eventId }: UseAttendanceDataProps) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<AttendanceStats>({
    totalRegistrations: 0,
    attendedUsersCount: 0,
    cannotReciteAndWalkCount: 0,
    cancelledUsersCount: 0,
  });

  const calculateStats = useCallback((registrations: EventRegistration[]) => {
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

    setStats({ 
      totalRegistrations: total, 
      attendedUsersCount: attended, 
      cannotReciteAndWalkCount: cannotReciteAndWalk, 
      cancelledUsersCount: cancelled 
    });
  }, []);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/events/${eventId}/attendees`);
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
        
        setRegistrations(prev => {
          if (!isEqual(prev, mappedAttendees)) {
            return mappedAttendees;
          }
          return prev;
        });
      } else {
        setRegistrations([]);
        setError('No registrations found for this event. 未找到此活动的报名。');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setError('Failed to fetch registrations. 获取报名失败。');
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const markAttendance = useCallback(async (
    registrationId: string, 
    groupId: string, 
    attended: boolean
  ) => {
    const [orderId] = registrationId.split('_');
    
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, eventId, groupId, attended }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to update attendance');
    }

    // Update local state
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

    return res.json();
  }, [eventId]);

  const cancelRegistration = useCallback(async (
    registrationId: string,
    groupId: string,
    queueNumber: string,
    cancelled: boolean
  ) => {
    const [orderId] = registrationId.split('_');
    
    const requestData = { 
      eventId,
      queueNumber,
      orderId,
      groupId,
      cancelled: Boolean(cancelled)
    };

    const res = await fetch('/api/cancel-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    if (!res.ok) {
      throw new Error(`Failed to ${cancelled ? 'cancel' : 'uncancel'} registration`);
    }

    // Update local state
    const updatedRegistrations = registrations.map(r => {
      if (r.id === registrationId) {
        return {
          ...r,
          order: {
            ...r.order,
            customFieldValues: r.order.customFieldValues.map(g => 
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
    return res.json();
  }, [eventId, registrations]);

  const deleteRegistration = useCallback(async (queueNumber: string) => {
    const res = await fetch('/api/delete-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, queueNumber }),
    });

    if (!res.ok) {
      throw new Error('Failed to delete registration');
    }

    // Refresh data after deletion
    await fetchRegistrations();
    return res.json();
  }, [eventId, fetchRegistrations]);

  useEffect(() => {
    calculateStats(registrations);
  }, [registrations, calculateStats]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return {
    registrations,
    isLoading,
    error,
    stats,
    fetchRegistrations,
    markAttendance,
    cancelRegistration,
    deleteRegistration,
  };
}; 