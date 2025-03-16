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

  const fetchOrder = async () => {
    const now = Date.now();
    // Debounce: Skip if last fetch was less than 1 second ago
    if (now - lastFetchTime.current < 1000) {
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
          // Fetch all orders for this phone number
          const response = await fetch(`/api/reg?phoneNumber=${encodeURIComponent(phoneNumber)}`);
          if (response.ok) {
            const data = await response.json();
            
            // Find the event that matches our current order's event
            const matchingEvent = data.find((item: any) => 
              item.event._id === fetchedOrder.event._id.toString()
            );
            
            if (matchingEvent && matchingEvent.orderIds) {
              setRelatedOrders(matchingEvent.orderIds);
              
              // Fetch all related orders and combine their customFieldValues
              for (const orderId of matchingEvent.orderIds) {
                // Skip the current order as we already have it
                if (orderId === id) continue;
                
                const relatedOrder = await getOrderById(orderId);
                if (relatedOrder && relatedOrder.customFieldValues) {
                  allCustomFieldValues = [...allCustomFieldValues, ...relatedOrder.customFieldValues];
                }
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
      <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-2 sm:mb-4 relative">
      </div>

      <div id="order-details">
        <section className="bg-gradient-to-r from-primary-50 to-primary-100 bg-dotted-pattern bg-cover bg-center py-2 sm:py-3 md:py-6 rounded-t-xl sm:rounded-t-2xl">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-primary-500">
            注册成功 Registration Successful
          </h3>
          <p className="text-center text-primary-600 mt-2">
            当天请在报到处以此二维码登记。/ Please use this QR code to check in at the registration counter on the event day.
          </p>
        </section>

        <div className="bg-white shadow-lg rounded-b-xl sm:rounded-b-2xl overflow-hidden">
          <div className="p-2 sm:p-3 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            <div className="bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
              <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1 md:mb-2 text-primary-700">活动 Event: {order.event.title}</h4>
            </div>

            <div className="bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base">
              <p>
                <span className="font-semibold">日期时间 Date & Time:</span> 
                {formatBilingualDateTime(new Date(order.event.startDateTime)).cn.dateOnly} 
                <span className="ml-1">
                  {formatBilingualDateTime(new Date(order.event.startDateTime)).cn.timeOnly} - {formatBilingualDateTime(new Date(order.event.endDateTime)).cn.timeOnly.replace(/^[上下]午/, '')}
                </span>
              </p>
              {order.event.location && <p><span className="font-semibold">地点 Location:</span> {order.event.location}</p>}
            </div>

            {customFieldValuesArray.map((group: CustomFieldGroup, index: number) => (
              <div key={group.groupId} className={`mt-3 sm:mt-4 md:mt-6 bg-white shadow-md rounded-lg sm:rounded-xl overflow-hidden ${group.cancelled ? 'opacity-50' : ''}`}>
                <div className="bg-primary-500 p-2 sm:p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <h5 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2">
                        <span>第{['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index]}位参加者 Person {index + 1}</span>
                        {group.cancelled && <span className="text-red-200">(已取消 Cancelled)</span>}
                      </h5>
                      <div className="text-white/90 text-sm sm:text-base">
                        {group.fields.find(field => field.label.toLowerCase().includes('name'))?.value || 'N/A'}
                      </div>
                    </div>
                    {group.queueNumber && (
                      <div className="bg-white/90 p-2 md:p-3 rounded-lg sm:rounded-xl text-center w-full sm:w-auto">
                        <p className="text-xs md:text-sm text-primary-600">队列号 Queue Number</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-700">{group.queueNumber}</p>
                      </div>
                    )}
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
                          <div className="flex-1 flex items-center gap-2">
                            <span className="flex-1">{field.value}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (field.id) {
                                  const value = typeof field.value === 'string' ? field.value : '';
                                  handleEdit(group.groupId, field.id, value);
                                }
                              }}
                              className="h-9 w-9"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!group.cancelled && !group.attendance && (
                    <CancelButton
                      groupId={group.groupId}
                      orderId={id}
                      onCancel={() => handleCancellation(group.groupId)}
                    />
                  )}
                </div>
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 mb-2">1. 点击顶部菜单中的"活动查询"</p>
                      <p className="text-sm text-blue-600">Click on "活动查询 Event Lookup" in the top menu</p>
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
                      <p className="font-semibold text-blue-800 mb-2">2. 输入您的电话号码并查询</p>
                      <p className="text-sm text-blue-600">Enter your phone number and search</p>
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
                      <p className="font-semibold text-blue-800 mb-2">3. 点击活动卡片查看详情</p>
                      <p className="text-sm text-blue-600">Click on the event card to view details</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl mt-4 flex items-start gap-3 border-2 border-yellow-200 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;