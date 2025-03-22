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
import { CancelButtonProps, OrderDetailsPageProps } from '@/types';
import { Pencil, X, Check, Loader2, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { convertPhoneNumbersToLinks } from '@/lib/utils';
import { eventDefaultValues } from "@/constants";

// Define inline styles for custom UI elements
const styles = `
  .rotate-20 {
    transform: rotate(-20deg);
  }
`;

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
}) => (
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
));

const CancelButton = React.memo(({ groupId, orderId, onCancel, participantInfo, queueNumber }: CancelButtonProps & { participantInfo?: string, queueNumber?: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCancel = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Close the dialog immediately after the user confirms
      setDialogOpen(false);
      // The actual cancellation is now handled in the parent component's handleCancellation function
      onCancel();
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

              <p className="mt-2 text-amber-600">
                取消后，此座位将重新分配给其他参加者。
                <br />
                After cancellation, this seat will be reallocated to other participants.
              </p>
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

const UncancelButton = React.memo(({ groupId, orderId, onUncancel, participantInfo, queueNumber }: CancelButtonProps & { participantInfo?: string, queueNumber?: string, onUncancel: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleUncancel = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Close the dialog immediately after the user confirms
      setDialogOpen(false);
      // The actual uncancellation is now handled in the parent component's handleUncancellation function
      onUncancel();
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
    event: {
      title: string;
      startDateTime: string;
      endDateTime: string;
      location?: string;
      registrationSuccessMessage?: string;
      _id?: string;
    };
    customFieldValues: CustomFieldGroup[];
  } | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingField, setEditingField] = useState<{
    groupId: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [newlyMarkedGroups, setNewlyMarkedGroups] = useState<Set<string>>(new Set());
  const previousOrder = useRef<typeof order>(null);
  const lastFetchTime = useRef<number>(0);

  const playSuccessSound = () => {
    const audio = new Audio('/assets/sounds/success-beep.mp3');
    audio.play().catch(e => console.error('Error playing audio:', e));
  };

  const fetchOrder = useCallback(async () => {
    const now = Date.now();
    // Debounce: Skip if last fetch was less than 500ms ago
    if (now - lastFetchTime.current < 500) {
      return;
    }
    
    setIsPolling(true);
    try {
      // Fetch the primary order first
      const fetchedOrder = await getOrderById(id);
      
      // Find a phone number in the order to fetch related orders
      let phoneNumber = null;
      for (const group of fetchedOrder.customFieldValues) {
        const phoneField = group.fields.find(
          (field: any) => field.type === 'phone' || field.label.toLowerCase().includes('phone')
        );
        if (phoneField) {
          phoneNumber = phoneField.value;
          break;
        }
      }
      
      // If we found a phone number, fetch all related orders for the same event
      let allCustomFieldValues = [...fetchedOrder.customFieldValues];
      if (phoneNumber) {
        try {
          // We need to use a direct API call here rather than the client-side action to bypass the cancelled filter
          // so we can get ALL registrations including cancelled ones for this page
          // Add a timestamp to the URL to prevent caching
          const cacheBuster = `_t=${Date.now()}`;
          const response = await fetch(`/api/reg?phoneNumber=${encodeURIComponent(phoneNumber)}&includeAllRegistrations=true&${cacheBuster}`);
          if (response.ok) {
            const data = await response.json();
            
            // Find the event that matches our current order's event
            const matchingEvent = data.find((item: any) => 
              item.event._id === fetchedOrder.event._id.toString()
            );
            
            if (matchingEvent && matchingEvent.orderIds) {
              setRelatedOrders(matchingEvent.orderIds);
              
              // Fetch all related orders in parallel
              const relatedOrderIds = matchingEvent.orderIds.filter((orderId: string) => orderId !== id);
              if (relatedOrderIds.length > 0) {
                const relatedOrderPromises = relatedOrderIds.map((orderId: string) => getOrderById(orderId));
                const relatedOrderResults = await Promise.all(relatedOrderPromises);
                
                // Combine customFieldValues from all related orders
                relatedOrderResults.forEach((relatedOrder) => {
                  if (relatedOrder && relatedOrder.customFieldValues) {
                    allCustomFieldValues = [...allCustomFieldValues, ...relatedOrder.customFieldValues];
                  }
                });
              }
            }
          }
        } catch (error) {
          console.error('Error fetching related orders:', error);
        }
      }
      
      // Check for newly marked attendances
      if (previousOrder.current) {
        allCustomFieldValues.forEach((group: CustomFieldGroup) => {
          const prevGroup = previousOrder.current?.customFieldValues.find(
            (g: CustomFieldGroup) => g.groupId === group.groupId
          );
          if (group.attendance && !prevGroup?.attendance) {
            setNewlyMarkedGroups(prev => new Set(prev).add(group.groupId));
            playSuccessSound();
            // Clear the newly marked status after animation
            setTimeout(() => {
              setNewlyMarkedGroups(prev => {
                const next = new Set(prev);
                next.delete(group.groupId);
                return next;
              });
            }, 2000);
          }
        });
      }
      
      // Update the order with all combined customFieldValues
      const combinedOrder = {
        ...fetchedOrder,
        customFieldValues: allCustomFieldValues
      };
      
      previousOrder.current = combinedOrder;
      setOrder(combinedOrder);
      setIsLoading(false);
      lastFetchTime.current = now;
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsPolling(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Set up polling for real-time updates
  useEffect(() => {
    // Poll every 5 seconds for updates (changed from 1 second)
    const pollInterval = setInterval(fetchOrder, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [fetchOrder]);

  const handleCancellation = async (groupId: string, queueNumber?: string): Promise<void> => {
    // Log which participant is being cancelled with more detail
    console.log(`Cancelling participant: ${new Date().toISOString()}`);
    console.log(`  - groupId: ${groupId}`);
    console.log(`  - queueNumber: ${queueNumber || 'N/A'}`);
    console.log(`  - eventId: ${order?.event?._id || 'N/A'}`);
    console.log(`  - orderId: ${id}`);
    
    // Update the local state
    setOrder(prevOrder => {
      if (!prevOrder) return null;
      
      // First, identify the relevant group based on queueNumber if available, then groupId
      let targetGroup;
      
      if (queueNumber) {
        targetGroup = prevOrder.customFieldValues.find(group => group.queueNumber === queueNumber);
        if (targetGroup) {
          console.log(`  - Found matching group with queueNumber ${queueNumber}. GroupId: ${targetGroup.groupId}`);
        } else {
          console.warn(`  - WARNING: Could not find group with queueNumber ${queueNumber}`);
        }
      }
      
      // If we couldn't find by queueNumber or it wasn't provided, use groupId
      if (!targetGroup) {
        targetGroup = prevOrder.customFieldValues.find(group => group.groupId === groupId);
        if (targetGroup) {
          console.log(`  - Found matching group with groupId ${groupId}`);
        } else {
          console.warn(`  - WARNING: Could not find group with groupId ${groupId}`);
          // If we can't find either by queueNumber or groupId, return the order unchanged
          return prevOrder;
        }
      }
      
      const updatedOrder = {
        ...prevOrder,
        customFieldValues: prevOrder.customFieldValues.map(group =>
          group.groupId === targetGroup.groupId ? { ...group, cancelled: true } : group
        )
      };
      
      // Log the updated state to verify
      console.log('Updated order state:', updatedOrder.customFieldValues.map(g => ({
        groupId: g.groupId,
        queueNumber: g.queueNumber,
        cancelled: g.cancelled,
        cancelledType: typeof g.cancelled
      })));
      
      return updatedOrder;
    });
    
    // Call the API to update the backend
    try {
      console.log('Sending cancel request to API...');
      const cancelRequest = { 
        orderId: id, 
        groupId, 
        eventId: order?.event?._id, // Explicitly pass eventId
        cancelled: true // Explicitly pass true as a boolean
      };
      
      // Only include queueNumber in request if it's provided and not empty
      if (queueNumber) {
        console.log(`Including queueNumber ${queueNumber} in request`);
        Object.assign(cancelRequest, { queueNumber });
      }
      
      const response = await fetch('/api/cancel-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cancelRequest),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to cancel registration: ${data.error || response.statusText}`);
      }
      
      console.log('API response:', data);
      
      // Verify response data
      if (typeof data.cancelled !== 'boolean') {
        console.warn(`API returned non-boolean cancelled status: ${data.cancelled} (${typeof data.cancelled})`);
      }
      
      // Verify the response matches what we expected
      if (queueNumber && data.queueNumber !== queueNumber) {
        console.warn(`API returned different queueNumber than requested: requested=${queueNumber}, returned=${data.queueNumber}`);
      }
      
      // Update session storage to refresh Event Lookup page if user navigates back
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('eventLookupRegistrations');
        sessionStorage.removeItem('eventLookupAllRegistrations');
      }
      
      // Show success toast
      toast.success('已成功取消报名 Registration cancelled successfully', {
        duration: 3000,
        position: 'bottom-center',
      });

      // Immediately update the UI based on API response data
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        
        // Find the exact group using the data returned from API
        const targetGroupId = data.groupId || groupId;
        const targetQueueNumber = data.queueNumber || queueNumber;
        
        return {
          ...prevOrder,
          customFieldValues: prevOrder.customFieldValues.map(group => {
            // Match by groupId first, then by queueNumber if available
            if (group.groupId === targetGroupId || 
                (targetQueueNumber && group.queueNumber === targetQueueNumber)) {
              return { ...group, cancelled: true };
            }
            return group;
          })
        };
      });

      // Still fetch from server after a short delay to ensure complete synchronization
      setTimeout(() => {
        // Reset lastFetchTime to force immediate fetch regardless of debounce
        lastFetchTime.current = 0;
        fetchOrder();
      }, 1000); // Keep the delay to ensure backend has time to process
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast.error(`取消报名失败，请重试 Failed to cancel registration: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    }
  };

  const handleUncancellation = async (groupId: string, queueNumber?: string): Promise<void> => {
    // Log which participant is being uncancelled with more detail
    console.log(`Uncancelling participant: ${new Date().toISOString()}`);
    console.log(`  - groupId: ${groupId}`);
    console.log(`  - queueNumber: ${queueNumber || 'N/A'}`);
    console.log(`  - eventId: ${order?.event?._id || 'N/A'}`);
    console.log(`  - orderId: ${id}`);
    
    // Update the local state
    setOrder(prevOrder => {
      if (!prevOrder) return null;
      
      // First, identify the relevant group based on queueNumber if available, then groupId
      let targetGroup;
      
      if (queueNumber) {
        targetGroup = prevOrder.customFieldValues.find(group => group.queueNumber === queueNumber);
        if (targetGroup) {
          console.log(`  - Found matching group with queueNumber ${queueNumber}. GroupId: ${targetGroup.groupId}`);
        } else {
          console.warn(`  - WARNING: Could not find group with queueNumber ${queueNumber}`);
        }
      }
      
      // If we couldn't find by queueNumber or it wasn't provided, use groupId
      if (!targetGroup) {
        targetGroup = prevOrder.customFieldValues.find(group => group.groupId === groupId);
        if (targetGroup) {
          console.log(`  - Found matching group with groupId ${groupId}`);
        } else {
          console.warn(`  - WARNING: Could not find group with groupId ${groupId}`);
          // If we can't find either by queueNumber or groupId, return the order unchanged
          return prevOrder;
        }
      }
      
      const updatedOrder = {
        ...prevOrder,
        customFieldValues: prevOrder.customFieldValues.map(group =>
          group.groupId === targetGroup.groupId ? { ...group, cancelled: false } : group
        )
      };
      
      // Log the updated state to verify
      console.log('Updated order state:', updatedOrder.customFieldValues.map(g => ({
        groupId: g.groupId,
        queueNumber: g.queueNumber,
        cancelled: g.cancelled,
        cancelledType: typeof g.cancelled
      })));
      
      return updatedOrder;
    });
    
    // Call the API to update the backend
    try {
      console.log('Sending uncancel request to API...');
      const uncancelRequest = { 
        orderId: id, 
        groupId, 
        eventId: order?.event?._id, // Explicitly pass eventId
        cancelled: false // Explicitly pass false as a boolean to uncancel
      };
      
      // Only include queueNumber in request if it's provided and not empty
      if (queueNumber) {
        console.log(`Including queueNumber ${queueNumber} in request`);
        Object.assign(uncancelRequest, { queueNumber });
      }
      
      const response = await fetch('/api/cancel-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uncancelRequest),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to restore registration: ${data.error || response.statusText}`);
      }
      
      console.log('API response:', data);
      
      // Update session storage to refresh Event Lookup page if user navigates back
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('eventLookupRegistrations');
        sessionStorage.removeItem('eventLookupAllRegistrations');
      }
      
      // Show success toast
      toast.success('已成功恢复报名 Registration restored successfully', {
        duration: 3000,
        position: 'bottom-center',
      });

      // Immediately update the UI based on API response data
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        
        // Find the exact group using the data returned from API
        const targetGroupId = data.groupId || groupId;
        const targetQueueNumber = data.queueNumber || queueNumber;
        
        return {
          ...prevOrder,
          customFieldValues: prevOrder.customFieldValues.map(group => {
            // Match by groupId first, then by queueNumber if available
            if (group.groupId === targetGroupId || 
                (targetQueueNumber && group.queueNumber === targetQueueNumber)) {
              return { ...group, cancelled: false };
            }
            return group;
          })
        };
      });

      // Still fetch from server after a short delay to ensure complete synchronization
      setTimeout(() => {
        // Reset lastFetchTime to force immediate fetch regardless of debounce
        lastFetchTime.current = 0;
        fetchOrder();
      }, 1000); // Keep the delay to ensure backend has time to process
    } catch (error) {
      console.error('Error restoring registration:', error);
      toast.error(`恢复报名失败，请重试 Failed to restore registration: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    }
  };

  const handleEdit = (groupId: string, field: string, currentValue: string) => {
    setEditingField({ groupId, field });
    setEditValue(currentValue);
  };

  const handleSave = async (groupId: string) => {
    if (!editingField) return;
    
    try {
      // Store the current value locally before making the API call
      const fieldToUpdate = editingField.field;
      const newValue = editValue;
      
      // Update local state immediately before API call for instant UI feedback
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        return {
          ...prevOrder,
          customFieldValues: prevOrder.customFieldValues.map(group =>
            group.groupId === groupId
              ? {
                  ...group,
                  fields: group.fields.map(field =>
                    field.id === fieldToUpdate
                      ? { ...field, value: newValue }
                      : field
                  ),
                }
              : group
          ),
        };
      });
      
      // Clear editing state immediately
      setEditingField(null);
      setEditValue('');
      
      // Make API call
      const response = await fetch('/api/update-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: id,
          groupId,
          field: fieldToUpdate,
          value: newValue,
          isFromOrderDetails: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert to original value if API call fails
        toast.error(data.message || 'Failed to update field', {
          duration: 4000,
          position: 'bottom-center',
        });
        
        // Re-fetch the order to ensure data consistency
        fetchOrder();
        return;
      }

      toast.success('成功更新 Successfully updated', {
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('更新失败 Failed to update field', {
        duration: 4000,
        position: 'bottom-center',
      });
      // Re-fetch the order to ensure data consistency
      fetchOrder();
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

  // Sort customFieldValues by queueNumber if available
  const customFieldValuesArray = order?.customFieldValues
    ? [...order.customFieldValues].sort((a, b) => {
        if (a.queueNumber && b.queueNumber) {
          return parseInt(a.queueNumber) - parseInt(b.queueNumber);
        }
        return 0;
      })
    : [];

  return (
    <div className="my-4 sm:my-8 max-w-full sm:max-w-4xl mx-2 sm:mx-auto">
      <style jsx global>{styles}</style>
      <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-2 sm:mb-4 relative">
        {/* Removed the updating state display */}
      </div>

      <div id="order-details">
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
              <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 md:mb-2 text-primary-700">活动 Event: {order.event.title}</h4>
            </div>

            <div className="bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base">
              <p>
                <span className="font-semibold">日期时间 Date & Time: </span> 
                {formatBilingualDateTime(new Date(order.event.startDateTime)).cn.dateOnly} 
                <span className="ml-1">
                  {formatBilingualDateTime(new Date(order.event.startDateTime)).cn.timeOnly} - {formatBilingualDateTime(new Date(order.event.endDateTime)).cn.timeOnly.replace(/^[上下]午/, '')}
                </span>
              </p>
              {order.event.location && <p><span className="font-semibold">地点 Location:</span> {order.event.location}</p>}
            </div>

            {customFieldValuesArray.map((group: CustomFieldGroup, index: number) => (
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
                        <span>第{['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index]}位参加者 Participant {index + 1}</span>
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
                        {editingField?.groupId === group.groupId && editingField?.field === field.id ? (
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
                              onClick={() => handleSave(group.groupId)}
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
                          <div className="flex-1 flex items-center gap-1">
                            <span>{field.value}</span>
                            {!group.cancelled && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (field.id) {
                                    const value = typeof field.value === 'string' ? field.value : '';
                                    handleEdit(group.groupId, field.id, value);
                                  }
                                }}
                                className="ml-1 text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-auto"
                              >
                                <Pencil className="h-3 w-3" />
                                <span className="text-xs ml-1">编辑 Edit</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!group.cancelled && !group.attendance && (
                    <CancelButton
                      groupId={group.groupId}
                      orderId={id}
                      queueNumber={group.queueNumber}
                      participantInfo={`第${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index]}位参加者 (${group.fields.find(field => field.label.toLowerCase().includes('name'))?.value || 'Unknown'})`}
                      onCancel={() => handleCancellation(group.groupId, group.queueNumber)}
                    />
                  )}
                  
                  {group.cancelled && (
                    <UncancelButton
                      groupId={group.groupId}
                      orderId={id}
                      queueNumber={group.queueNumber}
                      participantInfo={`第${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index]}位参加者 (${group.fields.find(field => field.label.toLowerCase().includes('name'))?.value || 'Unknown'})`}
                      onUncancel={() => handleUncancellation(group.groupId, group.queueNumber)}
                    />
                  )}
                </div>
                {/* Add a debug message that's only visible in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-2 text-xs text-gray-400">
                    groupId: {group.groupId} | queueNumber: {group.queueNumber} | Index: {index}
                  </div>
                )}
                {/* End of Registration Details Section */}
              </div>
            ))}

            <div className="mt-6 sm:mt-8 bg-green-50 border-l-4 border-green-400 p-2 sm:p-3 md:p-4 rounded-r-lg sm:rounded-r-xl">
              <h4 className="text-base sm:text-lg font-bold mb-2 text-green-700">重要信息 Important Information</h4>
              <div 
                className="whitespace-pre-wrap text-green-800 break-words text-sm sm:text-base"
                dangerouslySetInnerHTML={{ 
                  __html: convertLinksInText(eventDefaultValues.registrationSuccessMessage) 
                }}
              />
            </div>

            {/* How to find this page section - Now with improved UI */}
            <div className="mt-6 sm:mt-8 bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-lg border border-blue-200">
              <h4 className="text-lg sm:text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                如何在活动当天找回此页面 How to Find This Page on Event Day
              </h4>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="text-sm font-medium text-blue-600">目录</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 mb-2">1. 点击顶部菜单"目录"按钮</p>
                      <p className="text-sm text-blue-600">Click on the "目录" menu button at the top</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 mb-2">2. 在目录中选择"活动查询 Event Lookup"</p>
                      <p className="text-sm text-blue-600">Select "活动查询 Event Lookup" from the menu</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 mb-2">3. 输入您的电话号码并查询</p>
                      <p className="text-sm text-blue-600">Enter your phone number and search</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 mb-2">4. 点击活动照片查看详情</p>
                      <p className="text-sm text-blue-600">Click on the event photo to view details</p>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with React.memo
export default React.memo(OrderDetailsPage);