'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getOrderById } from '@/lib/actions/order.actions';
import { formatBilingualDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';
import Image from 'next/image';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { OrderDetailsPageProps } from '@/types';
import { Pencil, X, Check, Loader2, RotateCcw, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { convertPhoneNumbersToLinks, prepareRegistrationIdentifiers, toChineseOrdinal } from '@/lib/utils';
import { eventDefaultValues } from "@/constants";

// Define inline styles for custom UI elements
const styles = `
  .rotate-20 {
    transform: rotate(-20deg);
  }
`;

interface CancelButtonProps {
  groupId: string;
  orderId: string;
  onCancel: (groupId: string, queueNumber?: string) => void;
  participantInfo?: string;
  queueNumber?: string;
}

const convertToGoogleMapsLink = (location: string) => {
  const encodedLocation = encodeURIComponent(location);
  // Create URLs for both web and mobile deep links
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  const mobileUrl = `comgooglemaps://?q=${encodedLocation}&zoom=17`;
  const appleMapsUrl = `maps://maps.apple.com/?q=${encodedLocation}`;
  
  return {
    webUrl,
    mobileUrl,
    appleMapsUrl
  };
};

const convertAddressesToLinks = (text: string) => {
  // Enhanced regex pattern to catch more Singapore address formats
  const addressRegex = /(?:\d+(?:\s*,\s*)?(?:Lor(?:ong)?|Jln|Jalan|Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd|Close|Cl|Way|Walk|Place|Pl|Square|Sq)\s*\d*\s*,\s*[A-Za-z\s,-]+(?:Singapore|S'pore|SG)?(?:\s+#\d{2,3}-\d{2,3})?(?:\s+S?\(?(?:\d{6}|\d{4})\)?)?)/gi;
  
  return text.replace(addressRegex, (match) => {
    const links = convertToGoogleMapsLink(match);
    return `<a href="${links.webUrl}" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:text-primary-600 transition-colors">${match}</a>`;
  });
};

const convertLinksInText = (text: string) => {
  // First convert phone numbers
  let processedText = convertPhoneNumbersToLinks(text);
  // Convert Google Maps links - handle both with and without newlines, and both full-width and half-width colons
  processedText = processedText.replace(
    /(?:Google Maps[：:]?\s*)(https?:\/\/(?:goo\.gl\/maps\/[^\s\n]+|maps\.google\.com\/[^\s\n]+))/gi,
    (match, url) => {
      return `Google Maps：<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:text-primary-600 transition-colors">${url}</a>`;
    }
  );
  return processedText;
};

const QRCodeDisplay = React.memo(({ qrCode, isAttended, isNewlyMarked, queueNumber }: { 
  qrCode: string, 
  isAttended: boolean,
  isNewlyMarked?: boolean,
  queueNumber?: string
}) => {
  // If attendance is already marked, we don't need to keep updating the QR code
  const [shouldUpdate, setShouldUpdate] = React.useState(!isAttended);

  React.useEffect(() => {
    // Only allow updates if attendance is not marked
    setShouldUpdate(!isAttended);
  }, [isAttended]);

  // If we shouldn't update and it's not newly marked, return the last rendered state
  if (!shouldUpdate && !isNewlyMarked) {
    return (
      <div className="w-full max-w-sm mx-auto mb-6">
        <h6 className="text-lg font-semibold mb-2 text-center">二维码 QR Code</h6>
        <div className="relative aspect-square w-full opacity-40 grayscale transition-all duration-300">
          <Image 
            src={qrCode} 
            alt="QR Code" 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="bg-green-100/90 p-3 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <svg 
                  className="w-6 h-6 text-green-600"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
                <span className="text-lg font-semibold text-green-700">已出席</span>
              </div>
              <p className="text-sm text-green-600 text-center mt-1">Attendance Marked</p>
            </div>
            <div className="bg-yellow-100/90 px-3 py-1 rounded-lg mt-2">
              <p className="text-sm text-yellow-700">请保留此二维码以供核实 Please keep this QR code for verification</p>
            </div>
          </div>
        </div>
        {queueNumber && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">队列号 Queue Number</p>
            <p className="text-sm text-gray-600">{queueNumber}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      <h6 className="text-lg font-semibold mb-2 text-center">二维码 QR Code</h6>
      <div className={`relative aspect-square w-full ${isAttended ? 'opacity-40 grayscale' : ''} transition-all duration-300
        ${isNewlyMarked ? 'animate-flash' : ''}`}>
        <Image 
          src={qrCode} 
          alt="QR Code" 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain"
          priority // Add priority to ensure QR code loads quickly
        />
        {isAttended && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-300
            ${isNewlyMarked ? 'animate-fade-in scale-105' : ''}`}>
            <div className="bg-green-100/90 p-3 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-6 h-6 text-green-600 ${isNewlyMarked ? 'animate-check-mark' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
                <span className="text-lg font-semibold text-green-700">已出席</span>
              </div>
              <p className="text-sm text-green-600 text-center mt-1">Attendance Marked</p>
            </div>
            <div className="bg-yellow-100/90 px-3 py-1 rounded-lg mt-2">
              <p className="text-sm text-yellow-700">请保留此二维码以供核实 Please keep this QR code for verification</p>
            </div>
          </div>
        )}
      </div>
      {queueNumber && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">队列号 Queue Number</p>
          <p className="text-sm text-gray-600">{queueNumber}</p>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these specific props change
  return (
    prevProps.qrCode === nextProps.qrCode &&
    prevProps.isAttended === nextProps.isAttended &&
    prevProps.isNewlyMarked === nextProps.isNewlyMarked &&
    prevProps.queueNumber === nextProps.queueNumber
  );
});

const CancelButton = React.memo(({ groupId, orderId, onCancel, participantInfo, queueNumber }: CancelButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCancel = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Close the dialog immediately after the user confirms
      setDialogOpen(false);
      // The actual cancellation is now handled in the parent component's handleCancellation function
      onCancel(groupId, queueNumber);
    } catch (error) {
      console.error('Error in CancelButton handleCancel:', error);
    } finally {
      // We don't need to reset isLoading here as the dialog is already closed
      // The loading state will be reset when the component re-renders due to parent state changes
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full sm:w-auto mt-4"
          disabled={isLoading}
          onClick={() => setDialogOpen(true)}
        >
          {isLoading ? '取消中... Cancelling...' : '取消报名 Cancel Registration'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>确认取消 Confirm Cancellation</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要取消{participantInfo ? `${participantInfo}的` : '此'}报名吗？此操作无法撤消。
            <br />
            Are you sure you want to cancel {participantInfo ? `${participantInfo}'s` : 'this'} registration? This action cannot be undone.
            <br />
            <div className="mt-3 text-gray-500 text-xs">
              {queueNumber && <p>队列号 Queue #: {queueNumber}</p>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消 Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              '确认 Confirm'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

const UncancelButton = React.memo(({ groupId, orderId, onUncancel, participantInfo, queueNumber }: { 
  groupId: string;
  orderId: string;
  onUncancel: (groupId: string, queueNumber?: string) => void;
  participantInfo?: string;
  queueNumber?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleUncancel = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Close the dialog immediately after the user confirms
      setDialogOpen(false);
      // The actual uncancellation is now handled in the parent component's handleUncancellation function
      onUncancel(groupId, queueNumber);
    } catch (error) {
      console.error('Error in UncancelButton handleUncancel:', error);
    } finally {
      // We don't need to reset isLoading here as the dialog is already closed
      // The loading state will be reset when the component re-renders due to parent state changes
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full sm:w-auto mt-4 border-green-500 text-green-500 hover:bg-green-50"
          disabled={isLoading}
          onClick={() => setDialogOpen(true)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              处理中... Processing...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              恢复报名 Restore Registration
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>确认恢复报名 Confirm Restoration</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要恢复{participantInfo ? `${participantInfo}的` : '此'}报名吗？这将重新激活该报名。
            <br />
            Are you sure you want to restore {participantInfo ? `${participantInfo}'s` : 'this'} registration? This will reactivate the registration.
            <br />
            <div className="mt-3 text-gray-500 text-xs">
              {queueNumber && <p>队列号 Queue #: {queueNumber}</p>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消 Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUncancel} className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              '确认恢复 Confirm'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({ params: { id } }) => {
  const [order, setOrder] = useState<{
    _id: string;
    event: {
      title: string;
      startDateTime: string;
      endDateTime: string;
      location?: string;
      registrationSuccessMessage?: string;
      _id?: string;
    };
    customFieldValues: CustomFieldGroup[];
    createdAt: string;
  } | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<Array<{
    _id: string;
    event: {
      title: string;
      startDateTime: string;
      endDateTime: string;
      location?: string;
      registrationSuccessMessage?: string;
      _id?: string;
    };
    customFieldValues: CustomFieldGroup[];
    createdAt: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingField, setEditingField] = useState<{
    groupId: string;
    field: string;
    label?: string;
    queueNumber?: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [newlyMarkedGroups, setNewlyMarkedGroups] = useState<Set<string>>(new Set());
  const previousOrder = useRef<typeof order>(null);
  const lastFetchTime = useRef<number>(0);
  const processedAttendances = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const playSuccessSound = () => {
    const audio = new Audio('/assets/sounds/success-beep.mp3');
    audio.play().catch(e => console.error('Error playing audio:', e));
  };

  const fetchOrderDetails = useCallback(async () => {
    // Don't fetch if we've fetched recently (debounce)
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) { // 2 second debounce
      return;
    }
    
    setIsLoading(true);
    try {
      // First get the initial order to get the phone number
      const initialOrder = await getOrderById(id);
      if (!initialOrder) {
        setError('Order not found');
        return;
      }

      // Extract phone numbers from the order
      const phoneNumbers = initialOrder.customFieldValues.flatMap((group: CustomFieldGroup) => 
        group.fields
          .filter((field: CustomField) => field.type === 'phone' || field.label.toLowerCase().includes('phone'))
          .map((field: CustomField) => field.value)
      );

      // If we have phone numbers, fetch all orders including cancelled ones
      if (phoneNumbers.length > 0) {
        const phoneNumber = phoneNumbers[0];
        const response = await fetch(`/api/reg?phoneNumber=${encodeURIComponent(phoneNumber)}&includeAllRegistrations=true`);
        
        if (response.ok) {
          const data = await response.json();
          
          // data is an array of grouped orders by event
          // We need to find all orders for the current event
          const currentEventId = initialOrder.event._id;
          const currentEventOrders = data.find((group: any) => group.event._id === currentEventId);
          
          if (currentEventOrders) {
            // Get all orders for this event
            const orderIds = currentEventOrders.orderIds;
            const allOrders = await Promise.all(
              orderIds.map((orderId: string) => getOrderById(orderId))
            );
            
            // Filter out the current order and any null results
            const otherOrders = allOrders.filter(order => order && order._id !== initialOrder._id);
            
            setOrder(initialOrder); // Keep the initial order for the main display
            setRelatedOrders(otherOrders); // Set all other orders for this event
          }
        }
      }

      setError(null);
      lastFetchTime.current = now;
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleCancellation = async (groupId: string, queueNumber?: string): Promise<void> => {
    if (!queueNumber) {
        console.error('Cannot cancel registration: queueNumber is required');
        toast.error('取消报名失败: 缺少队列号 / Cannot cancel registration: missing queue number', {
            duration: 4000,
            position: 'top-center',
        });
        return;
    }
    
    if (!order?.event?._id) {
        console.error('Cannot cancel registration: eventId is required');
        toast.error('取消报名失败: 缺少活动ID / Cannot cancel registration: missing event ID', {
            duration: 4000,
            position: 'top-center',
        });
        return;
    }

    // Store the old values in case we need to revert (capture current state)
    const oldOrder = structuredClone(order);
    const oldRelatedOrders = structuredClone(relatedOrders);

    // Optimistically update local state first
    setOrder(prevOrder => {
        if (!prevOrder) return null;
        return {
            ...prevOrder,
            customFieldValues: prevOrder.customFieldValues.map(group =>
                group.queueNumber === queueNumber ? { ...group, cancelled: true } : group
            )
        };
    });

    setRelatedOrders(prevOrders => {
        return prevOrders.map(relatedOrder => ({
            ...relatedOrder,
            customFieldValues: relatedOrder.customFieldValues.map(group =>
                group.queueNumber === queueNumber ? { ...group, cancelled: true } : group
            )
        }));
    });
    
    try {
        // Create request data
        const requestData = {
            eventId: order.event._id,
            queueNumber: queueNumber,
            orderId: id,
            groupId: groupId,
            cancelled: true
        };
        
        // Make API call in the background
        const response = await fetch('/api/cancel-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            // Revert local state if API call fails
            setOrder(oldOrder);
            setRelatedOrders(oldRelatedOrders);
            const data = await response.json();
            throw new Error(data.error || response.statusText);
        }

        // Update session storage in the background
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('eventLookupRegistrations');
            sessionStorage.removeItem('eventLookupAllRegistrations');
        }
        
        toast.success('已成功取消报名 Registration cancelled successfully', {
            duration: 3000,
            position: 'top-center',
        });
    } catch (error) {
        console.error('Error cancelling registration:', error);
        toast.error(`取消报名失败，请重试 Failed to cancel registration: ${error instanceof Error ? error.message : 'Unknown error'}`, {
            duration: 4000,
            position: 'top-center',
        });
    }
  };

  const handleUncancellation = async (groupId: string, queueNumber?: string): Promise<void> => {
    if (!queueNumber) {
        console.error('Cannot restore registration: queueNumber is required');
        toast.error('恢复报名失败: 缺少队列号 / Cannot restore registration: missing queue number', {
            duration: 4000,
            position: 'top-center',
        });
        return;
    }
    
    if (!order?.event?._id) {
        console.error('Cannot restore registration: eventId is required');
        toast.error('恢复报名失败: 缺少活动ID / Cannot restore registration: missing event ID', {
            duration: 4000,
            position: 'top-center',
        });
        return;
    }

    // Store old state for potential revert
    const oldOrder = order;
    const oldRelatedOrders = relatedOrders;

    // Optimistically update local state first
    setOrder(prevOrder => {
        if (!prevOrder) return null;
        return {
            ...prevOrder,
            customFieldValues: prevOrder.customFieldValues.map(group =>
                group.queueNumber === queueNumber ? { ...group, cancelled: false } : group
            )
        };
    });

    setRelatedOrders(prevOrders => {
        return prevOrders.map(relatedOrder => ({
            ...relatedOrder,
            customFieldValues: relatedOrder.customFieldValues.map(group =>
                group.queueNumber === queueNumber ? { ...group, cancelled: false } : group
            )
        }));
    });
    
    try {
        // Create request data
        const requestData = {
            eventId: order.event._id,
            queueNumber: queueNumber,
            orderId: id,
            groupId: groupId,
            cancelled: false
        };
        
        // Make API call in the background
        const response = await fetch('/api/cancel-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            // Revert local state if API call fails
            setOrder(oldOrder);
            setRelatedOrders(oldRelatedOrders);
            const data = await response.json();
            throw new Error(data.error || response.statusText);
        }

        // Update session storage in the background
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('eventLookupRegistrations');
            sessionStorage.removeItem('eventLookupAllRegistrations');
        }
        
        toast.success('已成功恢复报名 Registration restored successfully', {
            duration: 3000,
            position: 'top-center',
        });
    } catch (error) {
        console.error('Error restoring registration:', error);
        toast.error(`恢复报名失败，请重试 Failed to restore registration: ${error instanceof Error ? error.message : 'Unknown error'}`, {
            duration: 4000,
            position: 'top-center',
        });
    }
  };

  const handleEdit = (queueNumber: string, field: string, currentValue: string) => {
    // Find the group by queue number
    const currentGroup = order?.customFieldValues.find(g => g.queueNumber === queueNumber);
    
    if (!currentGroup) {
        console.error('Could not find group with queue number:', queueNumber);
        toast.error('Error: Could not find the correct registration to edit', {
            duration: 4000,
            position: 'top-center',
        });
        return;
    }

    const fieldData = currentGroup.fields.find(f => f.id === field);
    const fieldLabel = fieldData?.label || '';
    
    setEditingField({ 
        groupId: currentGroup.groupId,
        field, 
        label: fieldLabel,
        queueNumber
    });
    setEditValue(currentValue);
  };

  const handleSave = async (queueNumber: string) => {
    if (!editingField) return;
    
    try {
        const fieldToUpdate = editingField.field;
        const newValue = editValue;
        
        // Clear editing state immediately for responsive UI
        setEditingField(null);
        setEditValue('');

        // Store the old values in case we need to revert (capture current state)
        const oldOrder = structuredClone(order);
        const oldRelatedOrders = structuredClone(relatedOrders);

        // Optimistically update local state first
        setOrder(prevOrder => {
            if (!prevOrder) return null;
            return {
                ...prevOrder,
                customFieldValues: prevOrder.customFieldValues.map(group => {
                    if (group.queueNumber === queueNumber) {
                        return {
                            ...group,
                            fields: group.fields.map(field =>
                                field.id === fieldToUpdate
                                    ? { ...field, value: newValue }
                                    : field
                            ),
                        };
                    }
                    return group;
                }),
            };
        });

        setRelatedOrders(prevOrders => {
            return prevOrders.map(relatedOrder => {
                return {
                    ...relatedOrder,
                    customFieldValues: relatedOrder.customFieldValues.map(group => {
                        if (group.queueNumber === queueNumber) {
                            return {
                                ...group,
                                fields: group.fields.map(field =>
                                    field.id === fieldToUpdate
                                        ? { ...field, value: newValue }
                                        : field
                                ),
                            };
                        }
                        return group;
                    }),
                };
            });
        });
        
        if (!order?.event?._id) {
            throw new Error('Cannot update: missing event ID');
        }
        
        // Prepare request data
        const requestData = {
            eventId: order.event._id,
            queueNumber,
            field: fieldToUpdate,
            value: newValue,
            isFromOrderDetails: true
        };
        
        // Make API call in the background
        const response = await fetch('/api/update-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            // Revert local state if API call fails
            setOrder(oldOrder);
            setRelatedOrders(oldRelatedOrders);
            const data = await response.json();
            throw new Error(data.message || 'Failed to update field');
        }

        // Update session storage in the background
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('eventLookupRegistrations');
            sessionStorage.removeItem('eventLookupAllRegistrations');
        }

        toast.success('成功更新 Successfully updated', {
            duration: 3000,
            position: 'top-center',
        });
    } catch (error) {
        console.error('Error updating field:', error);
        toast.error('更新失败 Failed to update field', {
            duration: 4000,
            position: 'top-center',
        });
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  if (isLoading) {
    return <div className="wrapper my-8 text-center">加载中... Loading...</div>;
  }

  if (!order) {
    return <div className="wrapper my-8 text-center text-2xl font-bold text-red-500">报名资料未找到 Registration not found</div>;
  }

  // Combine current order and related orders with proper null checks
  const allOrders = [order, ...(relatedOrders || []).filter(relatedOrder => relatedOrder && relatedOrder._id !== order._id)];
  
  // Get all customFieldValues from all orders and sort by queue number
  const allCustomFieldValues = allOrders.flatMap(order => 
    order.customFieldValues.map(group => ({
      ...group,
      orderId: order._id, // Keep track of which order this came from
      event: order.event // Keep the event info
    }))
  ).sort((a, b) => {
    // Extract numbers from queue numbers for proper numeric sorting
    const aNum = parseInt((a.queueNumber || '0').replace(/\D/g, ''));
    const bNum = parseInt((b.queueNumber || '0').replace(/\D/g, ''));
    return aNum - bNum;
  });

  return (
    <div className="my-4 sm:my-8 max-w-full sm:max-w-4xl mx-2 sm:mx-auto">
      <style jsx global>{styles}</style>
      
      <div>
        <section className="bg-gradient-to-r from-primary-50 to-primary-100 bg-dotted-pattern bg-cover bg-center py-2 sm:py-3 md:py-6 rounded-t-xl sm:rounded-t-2xl">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-primary-500">
            报名成功 Successful Registration
          </h3>
          <p className="text-center text-primary-600 mt-2">
            当天请在报到处以此二维码点名。/ Please use this QR code to take attendance at the registration counter on the event day.
          </p>
        </section>

        <div className="bg-white shadow-lg rounded-b-xl sm:rounded-b-2xl overflow-hidden">
          <div className="p-2 sm:p-3 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            <div className="bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
              <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 md:mb-2 text-primary-700">活动 Event: {order.event?.title || 'N/A'}</h4>
            </div>

            <div className="bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base">
              <p>
                <span className="font-semibold">日期时间 Date & Time: </span> 
                {order.event?.startDateTime ? (
                  <>
                    {formatBilingualDateTime(new Date(order.event.startDateTime)).cn.dateOnly} 
                    <span className="ml-1">
                      {formatBilingualDateTime(new Date(order.event.startDateTime)).cn.timeOnly} - {formatBilingualDateTime(new Date(order.event.endDateTime || '')).cn.timeOnly.replace(/^[上下]午/, '')}
                    </span>
                  </>
                ) : 'N/A'}
              </p>
              {order.event?.location && <p><span className="font-semibold">地点 Location:</span> {order.event.location}</p>}
            </div>

            {/* Display all participants sorted by queue number */}
            {allCustomFieldValues.map((group, index) => {
              if (!group) return null;
              
              return (
                <div key={group.groupId} className={`mt-3 sm:mt-4 md:mt-6 bg-white shadow-md rounded-lg sm:rounded-xl overflow-hidden ${group.cancelled ? 'opacity-75 relative' : ''}`}>
                  {group.cancelled && (
                    <div className="absolute inset-0 z-10 bg-gray-200/30 pointer-events-none flex items-center justify-center overflow-hidden">
                      <div className="rotate-20 bg-red-100 text-red-800 px-8 py-2 text-xl font-bold shadow-lg opacity-90 absolute">
                        已取消 CANCELLED
                      </div>
                    </div>
                  )}
                  <div className={`${group.cancelled ? 'bg-gray-500' : 'bg-primary-500'} p-2 sm:p-3 md:p-4`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <h5 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2">
                          <span>{toChineseOrdinal(index + 1)}参加者 Participant {index + 1}</span>
                          {group.cancelled && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              已取消 Cancelled
                            </span>
                          )}
                          <span className="text-xs opacity-50">#{group.queueNumber}</span>
                        </h5>
                        <div className="text-white/90 text-sm sm:text-base">
                          {group.fields.find(field => field.label.toLowerCase().includes('name'))?.value || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code for this participant */}
                  {!group.cancelled && group.qrCode && (
                    <div className="p-4 flex justify-center">
                      <div className="w-full max-w-[200px]">
                        <QRCodeDisplay 
                          qrCode={group.qrCode} 
                          isAttended={!!group.attendance}
                          isNewlyMarked={newlyMarkedGroups.has(group.groupId)}
                          queueNumber={group.queueNumber}
                        />
                      </div>
                    </div>
                  )}

                  {/* Registration Details Section */}
                  <div className="p-4 space-y-4">
                    {group.fields.map((field: CustomField) => (
                      <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-semibold text-gray-700 sm:w-1/3">{field.label}:</span>
                        <div className="flex-1 flex items-center gap-2">
                          {editingField?.queueNumber === group.queueNumber && editingField?.field === field.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const queueNumber = group.queueNumber as string;
                                  if (!queueNumber) {
                                    console.error('Cannot save: missing queue number');
                                    toast.error('Cannot save: missing queue number', {
                                      duration: 4000,
                                      position: 'top-center',
                                    });
                                    return;
                                  }
                                  handleSave(queueNumber);
                                }}
                                className="h-9 w-9"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCancel}
                                className="h-9 w-9"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 flex items-center gap-1">
                                {field.type === 'radio' 
                                  ? (field.value === 'yes' ? '是 Yes' : '否 No')
                                  : field.value || 'N/A'}
                                {/* Only show edit button for editable fields */}
                                {field.type !== 'radio' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const queueNumber = group.queueNumber as string;
                                      if (!queueNumber) {
                                        console.error('Cannot edit: missing queue number');
                                        toast.error('Cannot edit: missing queue number', {
                                          duration: 4000,
                                          position: 'top-center',
                                        });
                                        return;
                                      }
                                      console.log('Edit button clicked for:', {
                                        queueNumber,
                                        field: field.id,
                                        currentValue: field.value
                                      });
                                      if (field.id) {
                                        const value = typeof field.value === 'string' ? field.value : '';
                                        handleEdit(queueNumber, field.id, value);
                                      }
                                    }}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-auto"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    <span className="text-xs ml-1">修改 Edit</span>
                                  </Button>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {!group.cancelled && !group.attendance && (
                      <CancelButton
                        groupId={group.groupId}
                        orderId={id}
                        onCancel={(groupId) => handleCancellation(groupId, group.queueNumber)}
                        participantInfo={`${toChineseOrdinal(index + 1)}参加者 (${group.fields.find(field => field.label.toLowerCase().includes('name'))?.value || 'Unknown'})`}
                        queueNumber={group.queueNumber}
                      />
                    )}
                    
                    {group.cancelled && (
                      <UncancelButton
                        groupId={group.groupId}
                        orderId={id}
                        onUncancel={(groupId, queueNumber) => handleUncancellation(groupId, queueNumber)}
                        participantInfo={`${toChineseOrdinal(index + 1)}参加者 (${group.fields.find(field => field.label.toLowerCase().includes('name'))?.value || 'Unknown'})`}
                        queueNumber={group.queueNumber}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-green-50 border-l-4 border-green-400 p-2 sm:p-3 md:p-4 rounded-r-lg sm:rounded-r-xl">
        <h4 className="text-base sm:text-lg font-bold mb-2 text-green-700">重要信息 Important Information</h4>
        <div 
          className="whitespace-pre-wrap text-green-800 break-words text-sm sm:text-base"
          dangerouslySetInnerHTML={{ 
            __html: convertLinksInText(eventDefaultValues.registrationSuccessMessage) 
          }}
        />
      </div>

      <div className="mt-6 sm:mt-8 bg-blue-50/50 p-6 rounded-[20px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-xl font-semibold text-blue-900">如何在活动当天找回此页面 How to Find This Page on Event Day</h4>
        </div>
        
        <p className="text-blue-900 mb-6">请按照以下步骤操作 Please follow these steps:</p>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 flex items-start gap-4">
            <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center text-2xl font-bold text-blue-600">1</div>
            <div className="space-y-1">
              <div className="text-blue-900 font-medium">点击顶部"目录"按钮</div>
              <div className="text-blue-600">Click on the "目录" menu button at the top</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 flex items-start gap-4">
            <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center text-2xl font-bold text-blue-600">2</div>
            <div className="space-y-1">
              <div className="text-blue-900 font-medium">在目录中选择"活动查询 Event Lookup"</div>
              <div className="text-blue-600">Select "活动查询 Event Lookup" from the menu</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 flex items-start gap-4">
            <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center text-2xl font-bold text-blue-600">3</div>
            <div className="space-y-1">
              <div className="text-blue-900 font-medium">输入您的电话号码并查询</div>
              <div className="text-blue-600">Enter your phone number and search</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 flex items-start gap-4">
            <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center text-2xl font-bold text-blue-600">4</div>
            <div className="space-y-1">
              <div className="text-blue-900 font-medium">点击活动照片查看详情</div>
              <div className="text-blue-600">Click on the event photo to view details</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with React.memo
export default React.memo(OrderDetailsPage);