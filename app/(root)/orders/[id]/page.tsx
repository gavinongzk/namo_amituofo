'use client'

import { useState, useEffect } from 'react';
import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';
import Image from 'next/image';

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

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to create canvas context');
      }

      const qrSize = 200; // Size of each QR code
      const padding = 20; // Padding between QR codes
      const cols = 2; // Number of columns
      const rows = Math.ceil(qrCodes.length / cols);

      canvas.width = cols * qrSize + (cols + 1) * padding;
      canvas.height = rows * qrSize + (rows + 1) * padding + 40; // Extra 40px for labels

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < qrCodes.length; i++) {
        const { qrCode, personNumber } = qrCodes[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = col * (qrSize + padding) + padding;
        const y = row * (qrSize + padding) + padding;

        // Load and draw QR code
        const img = new Image();
        img.src = qrCode;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        ctx.drawImage(img, x, y, qrSize, qrSize);

        // Draw label
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Person ${personNumber}`, x + qrSize / 2, y + qrSize + 20);
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'all-qr-codes.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error creating QR codes image:', error);
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