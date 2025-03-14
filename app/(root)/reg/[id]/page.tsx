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
                {group.qrCode && (
                  <div className="qr-code-container">
                    <QRCodeDisplay 
                      qrCode={group.qrCode} 
                      isAttended={!!group.attendance}
                      isNewlyMarked={newlyMarkedGroups.has(group.groupId)}
                    />
                  </div>
                )}
                
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
              </div>
            ))},

            {/* How to find this page again section - Moved below QR codes */}
            <div className="mt-4 sm:mt-6 bg-blue-50 border-l-4 border-blue-400 p-2 sm:p-3 md:p-4 rounded-r-lg sm:rounded-r-xl">
              <h4 className="text-base sm:text-lg font-bold mb-2 text-blue-700">
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  如何在活动当天找回此页面 How to Find This Page on Event Day
                </span>
              </h4>
              <div className="space-y-2 text-blue-800 text-sm sm:text-base">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm flex flex-col items-center text-center sm:col-span-1">
                    <div className="bg-blue-100 p-2 rounded-full mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <p className="font-medium text-blue-700">1. 访问活动查询页面</p>
                    <p className="text-xs mt-1">点击下方链接 Click the link below</p>
                    <a 
                      href="https://reg.plb-sea.org/event-lookup" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs mt-2 bg-blue-100/70 px-2 py-1 rounded font-mono hover:bg-blue-200 transition-colors flex items-center gap-1"
                    >
                      reg.plb-sea.org/event-lookup
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 shadow-sm flex flex-col items-center text-center sm:col-span-1">
                    <div className="bg-blue-100 p-2 rounded-full mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <p className="font-medium text-blue-700">2. 输入电话号码</p>
                    <p className="text-xs mt-1">Enter your phone number</p>
                    <button className="text-xs mt-2 bg-primary-100 text-primary-700 px-2 py-1 rounded">查询 Search</button>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 shadow-sm flex flex-col items-center text-center sm:col-span-1">
                    <div className="bg-blue-100 p-2 rounded-full mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="font-medium text-blue-700">3. 点击活动卡片</p>
                    <p className="text-xs mt-1">Click on the event card</p>
                    <div className="text-xs mt-2 bg-gray-100 px-2 py-1 rounded w-full">
                      {order.event.title.substring(0, 15)}...
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 shadow-sm flex flex-col items-center text-center sm:col-span-1">
                    <div className="bg-blue-100 p-2 rounded-full mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <p className="font-medium text-blue-700">4. 出示二维码</p>
                    <p className="text-xs mt-1">Show the QR code</p>
                    <div className="text-xs mt-2 bg-green-100 text-green-700 px-2 py-1 rounded">完成签到 Check-in</div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg mt-3 flex items-center gap-3 border border-yellow-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p>
                    <span className="font-medium">重要提示：</span>请在活动当天出示此页面上的二维码以完成签到。没有二维码将无法确认您的出席。
                    <br />
                    <span className="font-medium">Important:</span> Please show the QR code on this page to complete check-in on the event day. Without the QR code, your attendance cannot be confirmed.
                  </p>
                </div>
              </div>
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
              <div key={group.groupId} className={`mt-4 sm:mt-6 bg-white shadow-md rounded-lg sm:rounded-xl overflow-hidden ${group.cancelled ? 'opacity-50' : ''}`}>
                <div className="p-2 sm:p-3 md:p-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    {group.fields.map((field: CustomField) => (
                      <div key={field.id} className="flex flex-col">
                        <dt className="font-medium text-gray-600 mb-1 text-sm sm:text-base">{field.label}</dt>
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
                              <span className="text-gray-900 font-semibold text-sm sm:text-base">
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
                                  className="p-1 hover:bg-gray-100 rounded inline-flex items-center gap-1 text-blue-600 text-sm"
                                >
                                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="text-xs sm:text-sm">编辑 Edit</span>
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
                  <div className="p-2 sm:p-3 md:p-4 bg-gray-50">
                    <CancelButton 
                      groupId={group.groupId} 
                      orderId={id} 
                      onCancel={() => handleCancellation(group.groupId)} 
                    />
                  </div>
                )}
                
                {group.cancelled && (
                  <div className="p-2 sm:p-3 md:p-4 bg-red-50">
                    <p className="text-red-600 text-center font-semibold text-sm sm:text-base">
                      注册已取消 Registration Cancelled
                    </p>
                  </div>
                )}
              </div>
            ))},

            <div className="mt-6 sm:mt-8 bg-green-50 border-l-4 border-green-400 p-2 sm:p-3 md:p-4 rounded-r-lg sm:rounded-r-xl">
              <h4 className="text-base sm:text-lg font-bold mb-2 text-green-700">重要信息 Important Information</h4>
              <div 
                className="whitespace-pre-wrap text-green-800 break-words text-sm sm:text-base"
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