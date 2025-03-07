'use client'

import { useState, useEffect, useRef } from 'react';
import { getOrderById } from '@/lib/actions/order.actions';
import { formatBilingualDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';
import Image from 'next/image';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CancelButtonProps, OrderDetailsPageProps } from '@/types';
import { Pencil, X, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { convertPhoneNumbersToLinks } from '@/lib/utils';
import { eventDefaultValues } from "@/constants";

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
    return `
      <span class="inline-flex flex-wrap gap-2 items-center">
        <span class="text-gray-700">${match}</span>
        <span class="inline-flex gap-2">
          <a href="${links.webUrl}" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            Open in Maps
          </a>
          <a href="${links.mobileUrl}" 
             class="md:hidden inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 11.5A2.5 2.5 0 0 1 9.5 9 2.5 2.5 0 0 1 12 6.5 2.5 2.5 0 0 1 14.5 9a2.5 2.5 0 0 1-2.5 2.5M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7"/>
            </svg>
            Google Maps App
          </a>
          <a href="${links.appleMapsUrl}" 
             class="md:hidden inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.14 2 5 5.14 5 9c0 4.17 4.42 9.92 6.24 12.11.4.48 1.13.48 1.53 0C14.58 18.92 19 13.17 19 9c0-3.86-3.14-7-7-7zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
            </svg>
            Apple Maps
          </a>
        </span>
      </span>
    `;
  });
};

const convertLinksInText = (text: string) => {
  // First convert phone numbers
  let processedText = convertPhoneNumbersToLinks(text);
  // Then convert addresses
  processedText = convertAddressesToLinks(processedText);
  // Convert Google Maps links - handle both with and without newlines, and both full-width and half-width colons
  processedText = processedText.replace(
    /(?:Google Maps[：:]?\s*)(https?:\/\/(?:goo\.gl\/maps\/[^\s\n]+|maps\.google\.com\/[^\s\n]+))/gi,
    (match, url) => {
      const links = convertToGoogleMapsLink(url);
      return `
        <span class="inline-flex flex-wrap gap-2">
          <a href="${url}" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            Open in Browser
          </a>
          <a href="${links.mobileUrl}" 
             class="md:hidden inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 11.5A2.5 2.5 0 0 1 9.5 9 2.5 2.5 0 0 1 12 6.5 2.5 2.5 0 0 1 14.5 9a2.5 2.5 0 0 1-2.5 2.5M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7"/>
            </svg>
            Google Maps App
          </a>
          <a href="${links.appleMapsUrl}" 
             class="md:hidden inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.14 2 5 5.14 5 9c0 4.17 4.42 9.92 6.24 12.11.4.48 1.13.48 1.53 0C14.58 18.92 19 13.17 19 9c0-3.86-3.14-7-7-7zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
            </svg>
            Apple Maps
          </a>
        </span>
      `;
    }
  );
  return processedText;
};

const QRCodeDisplay = ({ qrCode, isAttended, isNewlyMarked }: { 
  qrCode: string, 
  isAttended: boolean,
  isNewlyMarked?: boolean 
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
              <span className="text-lg font-semibold text-green-700">出席已记录</span>
            </div>
            <p className="text-sm text-green-600 text-center mt-1">Attendance Marked</p>
          </div>
          <div className="bg-yellow-100/90 px-3 py-1 rounded-lg mt-2">
            <p className="text-sm text-yellow-700">请保留此二维码以供核实 Please keep this QR code for verification</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

const CancelButton: React.FC<CancelButtonProps> = ({ groupId, orderId, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cancel-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, groupId, cancelled: true }),
      });

      if (!response.ok) throw new Error('Failed to cancel registration');
      onCancel();
    } catch (error) {
      console.error('Error cancelling registration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full sm:w-auto mt-4"
          disabled={isLoading}
        >
          {isLoading ? '取消中... Cancelling...' : '取消注册 Cancel Registration'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-opacity-100 bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle>确认取消 Confirm Cancellation</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要取消此注册吗？此操作无法撤消。
            <br />
            Are you sure you want to cancel this registration? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消 Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel}>
            确认 Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({ params: { id } }) => {
  const [order, setOrder] = useState<{
    event: {
      title: string;
      startDateTime: string;
      endDateTime: string;
      location?: string;
      registrationSuccessMessage?: string;
    };
    customFieldValues: CustomFieldGroup[];
  } | null>(null);
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

  const fetchOrder = async () => {
    const now = Date.now();
    // Debounce: Skip if last fetch was less than 1 second ago
    if (now - lastFetchTime.current < 1000) {
      return;
    }
    
    setIsPolling(true);
    try {
      const fetchedOrder = await getOrderById(id);
      
      // Check for newly marked attendances
      if (previousOrder.current) {
        fetchedOrder.customFieldValues.forEach((group: CustomFieldGroup) => {
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
      
      previousOrder.current = fetchedOrder;
      setOrder(fetchedOrder);
      setIsLoading(false);
      lastFetchTime.current = now;
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsPolling(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Set up polling for real-time updates
  useEffect(() => {
    // Poll every 2 seconds for updates
    const pollInterval = setInterval(fetchOrder, 2000);

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [id]);

  const handleCancellation = (groupId: string): void => {
    setOrder(prevOrder => {
      if (!prevOrder) return null;
      return {
        ...prevOrder,
        customFieldValues: prevOrder.customFieldValues.map(group =>
          group.groupId === groupId ? { ...group, cancelled: true } : group
        )
      };
    });
  };

  const handleEdit = (groupId: string, field: string, currentValue: string) => {
    setEditingField({ groupId, field });
    setEditValue(currentValue);
  };

  const handleSave = async (groupId: string) => {
    if (!editingField) return;
    
    try {
      const response = await fetch('/api/update-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: id,
          groupId,
          field: editingField.field,
          value: editValue,
          isFromOrderDetails: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to update field', {
          duration: 4000,
          position: 'bottom-center',
        });
        return;
      }

      // Update local state
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        return {
          ...prevOrder,
          customFieldValues: prevOrder.customFieldValues.map(group =>
            group.groupId === groupId
              ? {
                  ...group,
                  fields: group.fields.map(field =>
                    field.id === editingField.field
                      ? { ...field, value: editValue }
                      : field
                  ),
                }
              : group
          ),
        };
      });
      
      setEditingField(null);
      setEditValue('');
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

  const customFieldValuesArray = Array.isArray(order.customFieldValues) 
    ? order.customFieldValues 
    : [order.customFieldValues];

  return (
    <div className="wrapper my-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 gap-4 mb-4 relative">
        {isPolling && (
          <div className="absolute right-0 -bottom-6 flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">正在检查更新... Checking for updates...</span>
          </div>
        )}
      </div>

      <div id="order-details">
        <section className="bg-gradient-to-r from-primary-50 to-primary-100 bg-dotted-pattern bg-cover bg-center py-6 rounded-t-2xl">
          <h3 className="text-2xl font-bold text-center text-primary-500">
            注册成功 Registration Successful
          </h3>
        </section>

        <div className="bg-white shadow-lg rounded-b-2xl overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="text-lg font-bold mb-2 text-primary-700">活动 Event: {order.event.title}</h4>
              <p><span className="font-semibold">日期 Date:</span> {formatBilingualDateTime(new Date(order.event.startDateTime)).combined.dateOnly}</p>
              <p><span className="font-semibold">时间 Time:</span> {formatBilingualDateTime(new Date(order.event.startDateTime)).cn.timeOnly} - {formatBilingualDateTime(new Date(order.event.endDateTime)).cn.timeOnly} / 
              {formatBilingualDateTime(new Date(order.event.startDateTime)).en.timeOnly} - {formatBilingualDateTime(new Date(order.event.endDateTime)).en.timeOnly}
              </p>
              {order.event.location && <p><span className="font-semibold">地点 Location:</span> {order.event.location}</p>}
            </div>

            {customFieldValuesArray.map((group: CustomFieldGroup, index: number) => (
              <div key={group.groupId} className={`mt-6 bg-white shadow-md rounded-xl overflow-hidden ${group.cancelled ? 'opacity-50' : ''}`}>
                {group.qrCode && (
                  <div className="qr-code-container">
                    <QRCodeDisplay 
                      qrCode={group.qrCode} 
                      isAttended={!!group.attendance}
                      isNewlyMarked={newlyMarkedGroups.has(group.groupId)}
                    />
                  </div>
                )}
                
                <div className="bg-primary-100 p-4">
                  <div className="flex justify-between items-center">
                    <h5 className="text-lg font-semibold text-primary-700">人员 Person {index + 1}</h5>
                    {group.queueNumber && (
                      <div className="bg-blue-100 p-3 rounded-xl text-center mb-2 sm:mb-0 w-full sm:w-auto">
                        <p className="text-sm text-blue-600">队列号 Queue Number</p>
                        <p className="text-3xl font-bold text-blue-700">{group.queueNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.fields.map((field: CustomField) => (
                      <div key={field.id} className="flex flex-col">
                        <dt className="font-medium text-gray-600 mb-1">{field.label}</dt>
                        <dd className="flex items-center gap-2">
                          {editingField?.groupId === group.groupId && editingField?.field === field.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="max-w-[200px]"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSave(group.groupId)}
                                className="p-1 hover:bg-green-100 rounded"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-1 hover:bg-red-100 rounded"
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-gray-900 font-semibold">
                                {field.type === 'radio' 
                                  ? (field.value === 'yes' ? '是 Yes' : '否 No')
                                  : (field.value || 'N/A')}
                              </span>
                              {(field.label.toLowerCase().includes('name') || 
                                field.label.toLowerCase().includes('contact') || 
                                field.label.toLowerCase().includes('postal') || 
                                field.label.toLowerCase().includes('zip') || 
                                field.label.toLowerCase().includes('邮编') || 
                                field.label.toLowerCase().includes('邮政编码')) && !group.cancelled && (
                                <button
                                  onClick={() => handleEdit(group.groupId, field.id, field.value?.toString() ?? '')}
                                  className="p-1 hover:bg-gray-100 rounded inline-flex items-center gap-1 text-blue-600"
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="text-sm">编辑 Edit</span>
                                </button>
                              )}
                            </>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {!group.cancelled && (
                  <div className="p-4 bg-gray-50">
                    <CancelButton 
                      groupId={group.groupId} 
                      orderId={id} 
                      onCancel={() => handleCancellation(group.groupId)} 
                    />
                  </div>
                )}
                
                {group.cancelled && (
                  <div className="p-4 bg-red-50">
                    <p className="text-red-600 text-center font-semibold">
                      注册已取消 Registration Cancelled
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
              <h4 className="text-lg font-bold mb-2 text-green-700">重要信息 Important Information</h4>
              <div 
                className="whitespace-pre-wrap text-green-800 break-words"
                dangerouslySetInnerHTML={{ 
                  __html: convertLinksInText(eventDefaultValues.registrationSuccessMessage) 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;