'use client'

import { useState, useEffect, useRef } from 'react';
import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';
import Image from 'next/image';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CancelButtonProps, OrderDetailsPageProps } from '@/types';
import { Pencil, X, Check, Loader2, Share2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { convertPhoneNumbersToLinks } from '@/lib/utils';

const QRCodeDisplay = ({ qrCode, isAttended, isNewlyMarked }: { 
  qrCode: string, 
  isAttended: boolean,
  isNewlyMarked?: boolean 
}) => (
  <div className="w-full max-w-sm mx-auto mb-6">
    <h6 className="text-lg font-semibold mb-2 text-center">QR Code</h6>
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
              <span className="text-lg font-semibold text-green-700">Attendance Marked</span>
            </div>
            <p className="text-sm text-green-600 text-center mt-1">出席已记录</p>
          </div>
          <div className="bg-yellow-100/90 px-3 py-1 rounded-lg mt-2">
            <p className="text-sm text-yellow-700">Please keep this QR code for verification</p>
            <p className="text-xs text-yellow-600">请保留此二维码以供核实</p>
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
          {isLoading ? 'Cancelling...' : 'Cancel Registration 取消注册'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-opacity-100 bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Cancellation 确认取消</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this registration? This action cannot be undone.
            <br />
            您确定要取消此注册吗？此操作无法撤消。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel 取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel}>
            Confirm 确认
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
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
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

  const downloadAllQRCodes = async () => {
    if (!order) return;
    setIsDownloading(true);
    try {
      const qrCodes = order.customFieldValues
        .filter((group: CustomFieldGroup) => group.qrCode)
        .map((group: CustomFieldGroup, index: number) => ({
          qrCode: group.qrCode,
          personNumber: index + 1
        }));

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 10;
      const qrSize = 80;
      const cols = 2;
      const rows = Math.ceil(qrCodes.length / cols);

      pdf.setFontSize(16);
      pdf.text('QR Codes', pageWidth / 2, 20, { align: 'center' });

      for (let i = 0; i < qrCodes.length; i++) {
        const { qrCode, personNumber } = qrCodes[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = margin + col * (qrSize + margin);
        const y = 30 + row * (qrSize + margin + 20);

        if (qrCode) {
          pdf.addImage(qrCode, 'PNG', x, y, qrSize, qrSize);
          pdf.setFontSize(12);
          pdf.text(`Person ${personNumber}`, x + qrSize / 2, y + qrSize + 10, { align: 'center' });
        }

        if (y + qrSize + 30 > pageHeight && i < qrCodes.length - 1) {
          pdf.addPage();
          pdf.setFontSize(16);
          pdf.text('QR Codes (Continued)', pageWidth / 2, 20, { align: 'center' });
        }
      }

      pdf.save('all-qr-codes.pdf');
    } catch (error) {
      console.error('Error creating QR codes PDF:', error);
      // Optionally show an error message to the user
    } finally {
      setIsDownloading(false);
    }
  };

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
      toast.success('Successfully updated', {
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Failed to update field', {
        duration: 4000,
        position: 'bottom-center',
      });
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleShare = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSamsung = /SamsungBrowser/.test(navigator.userAgent);

    if (isIOS) {
      toast((t) => (
        <div>
          <p>To add to home screen:</p>
          <ol className="list-decimal ml-4 mt-2">
            <li>Tap the share button (box with arrow) at the bottom of Safari</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right corner</li>
          </ol>
        </div>
      ), {
        duration: 8000,
        position: 'bottom-center',
      });
    } else if (isAndroid && (isChrome || isSamsung)) {
      toast((t) => (
        <div>
          <p>To add to home screen:</p>
          <ol className="list-decimal ml-4 mt-2">
            <li>Tap the three dots menu (⋮) at the top right</li>
            <li>Select "Add to Home screen" or "Install app"</li>
            <li>Tap "Add" to confirm</li>
          </ol>
        </div>
      ), {
        duration: 8000,
        position: 'bottom-center',
      });
    } else {
      toast((t) => (
        <div>
          <p>To bookmark this page:</p>
          <ol className="list-decimal ml-4 mt-2">
            <li>Press Ctrl+D (Windows) or Cmd+D (Mac)</li>
            <li>Or tap the star/menu icon in your browser</li>
            <li>Select "Add bookmark" or "Add to favorites"</li>
          </ol>
        </div>
      ), {
        duration: 8000,
        position: 'bottom-center',
      });

      // Also try to use the share API if available
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Order Details',
            text: 'View my order details',
            url: window.location.href
          });
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="wrapper my-8 text-center">Loading...</div>;
  }

  if (!order) {
    return <div className="wrapper my-8 text-center text-2xl font-bold text-red-500">Registration not found 报名资料未找到</div>;
  }

  const customFieldValuesArray = Array.isArray(order.customFieldValues) 
    ? order.customFieldValues 
    : [order.customFieldValues];

  return (
    <div className="wrapper my-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={downloadAllQRCodes}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          disabled={isDownloading}
        >
          {isDownloading ? 'Generating...' : 'Download All QR Codes 下载所有二维码'}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded"
        >
          <Share2 className="h-4 w-4" />
          <span>Save for Easy Access 保存快捷方式</span>
        </button>
        
        {isPolling && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking for updates...</span>
          </div>
        )}
      </div>

      <div id="order-details">
        <section className="bg-gradient-to-r from-primary-50 to-primary-100 bg-dotted-pattern bg-cover bg-center py-6 rounded-t-2xl">
          <h3 className="text-2xl font-bold text-center text-primary-500">
            Registration Successful 注册成功
          </h3>
        </section>

        <div className="bg-white shadow-lg rounded-b-2xl overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="text-lg font-bold mb-2 text-primary-700">Event: {order.event.title}</h4>
              <p><span className="font-semibold">Date:</span> {formatDateTime(new Date(order.event.startDateTime)).dateOnly}</p>
              <p><span className="font-semibold">Time:</span> {formatDateTime(new Date(order.event.startDateTime)).timeOnly} - {formatDateTime(new Date(order.event.endDateTime)).timeOnly}</p>
              {order.event.location && <p><span className="font-semibold">Location:</span> {order.event.location}</p>}
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
                    <h5 className="text-lg font-semibold text-primary-700">Person 人员 {index + 1}</h5>
                    {group.queueNumber && (
                      <div className="bg-blue-100 p-3 rounded-xl text-center mb-2 sm:mb-0 w-full sm:w-auto">
                        <p className="text-sm text-blue-600">Queue Number 队列号</p>
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
                              {(field.label.toLowerCase().includes('name') || field.label.toLowerCase().includes('contact')) && !group.cancelled && (
                                <button
                                  onClick={() => handleEdit(group.groupId, field.id, field.value?.toString() ?? '')}
                                  className="p-1 hover:bg-gray-100 rounded inline-flex items-center gap-1 text-blue-600"
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="text-sm">Edit 编辑</span>
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
                      Registration Cancelled 注册已取消
                    </p>
                  </div>
                )}
              </div>
            ))}

            {order.event.registrationSuccessMessage && (
              <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
                <h4 className="text-lg font-bold mb-2 text-green-700">Important Information 重要信息</h4>
                <div 
                  className="whitespace-pre-wrap text-green-800"
                  dangerouslySetInnerHTML={{ 
                    __html: convertPhoneNumbersToLinks(order.event.registrationSuccessMessage) 
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;