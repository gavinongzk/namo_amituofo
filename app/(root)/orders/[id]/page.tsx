'use client'

import { useState, useEffect } from 'react';
import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const LoadingModal = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
      <p className="mt-4 text-center text-gray-700">Generating PDF...</p>
    </div>
  </div>
);

const OrderDetailsPage = ({ params: { id } }: { params: { id: string } }) => {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const fetchedOrder = await getOrderById(id);
      setOrder(fetchedOrder);
      setIsLoading(false);
    };
    fetchOrder();
  }, [id]);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const canvas = await html2canvas(document.body, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // Enable CORS for external images
        logging: false, // Disable logging for better performance
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('order-details-full-page.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Optionally, you can show an error message to the user here
    } finally {
      setIsGeneratingPDF(false);
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
        onClick={generatePDF}
        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        disabled={isGeneratingPDF}
      >
        {isGeneratingPDF ? 'Generating...' : 'Download Full Page PDF 下载完整页面PDF'}
      </button>

      {isGeneratingPDF && <LoadingModal />}

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
                {group.qrCode && <QRCodeDisplay qrCode={group.qrCode} />}
                
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