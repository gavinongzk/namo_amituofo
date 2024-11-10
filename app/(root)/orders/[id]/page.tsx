'use client'

import { useState, useEffect } from 'react';
import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';
import Image from 'next/image';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const QRCodeDisplay = ({ qrCode }: { qrCode: string }) => (
  <div className="w-full max-w-sm mx-auto mb-6">
    <h6 className="text-lg font-semibold mb-2 text-center">QR Code</h6>
    <div className="relative aspect-square w-full">
      <Image 
        src={qrCode} 
        alt="QR Code" 
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-contain"
      />
    </div>
  </div>
);

const CancelButton = ({ groupId, orderId, onCancel }: { groupId: string; orderId: string; onCancel: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
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
      <AlertDialogContent>
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

const OrderDetailsPage = ({ params: { id } }: { params: { id: string } }) => {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const fetchedOrder = await getOrderById(id);
      setOrder(fetchedOrder);
      setIsLoading(false);
    };
    fetchOrder();
  }, [id]);

  const downloadAllQRCodes = async () => {
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

        pdf.addImage(qrCode, 'PNG', x, y, qrSize, qrSize);
        pdf.setFontSize(12);
        pdf.text(`Person ${personNumber}`, x + qrSize / 2, y + qrSize + 10, { align: 'center' });

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

  if (isLoading) {
    return <div className="wrapper my-8 text-center">Loading...</div>;
  }

  if (!order) {
    return <div className="wrapper my-8 text-center text-2xl font-bold text-red-500">Order not found 订单未找到</div>;
  }

  const customFieldValuesArray = Array.isArray(order.customFieldValues) 
    ? order.customFieldValues 
    : [order.customFieldValues];

  return (
    <div className="wrapper my-8 max-w-4xl mx-auto">
      <button
        onClick={downloadAllQRCodes}
        className="mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        disabled={isDownloading}
      >
        {isDownloading ? 'Generating...' : 'Download All QR Codes 下载所有二维码'}
      </button>

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
              <p><span className="font-semibold">Date:</span> {formatDateTime(order.event.startDateTime).dateOnly}</p>
              <p><span className="font-semibold">Time:</span> {formatDateTime(order.event.startDateTime).timeOnly} - {formatDateTime(order.event.endDateTime).timeOnly}</p>
              {order.event.location && <p><span className="font-semibold">Location:</span> {order.event.location}</p>}
            </div>

            {customFieldValuesArray.map((group: CustomFieldGroup, index: number) => (
              <div key={group.groupId} className="mt-6 bg-white shadow-md rounded-xl overflow-hidden">
                {group.qrCode && (
                  <div className="qr-code-container">
                    <QRCodeDisplay qrCode={group.qrCode} />
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
                        <dd className="text-gray-900 font-semibold">
                          {field.type === 'radio' 
                            ? (field.value === 'yes' ? '是 Yes' : '否 No')
                            : (field.value || 'N/A')}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <CancelButton groupId={group.groupId} orderId={order.id} onCancel={() => setOrder(prevOrder => ({
                  ...prevOrder,
                  customFieldValues: prevOrder.customFieldValues.map(group =>
                    group.groupId === group.groupId ? { ...group, cancelled: true } : group
                }))} />
              </div>
            ))}

            {order.event.registrationSuccessMessage && (
              <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
                <h4 className="text-lg font-bold mb-2 text-green-700">Important Information 重要信息</h4>
                <div className="whitespace-pre-wrap text-green-800">
                  {order.event.registrationSuccessMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;