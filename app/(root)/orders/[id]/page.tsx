import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';
import Image from 'next/image';

const QRCodeDisplay = ({ qrCode }: { qrCode: string }) => (
  <div className="mt-4">
    <h6 className="text-sm font-semibold mb-2">QR Code</h6>
    <Image src={qrCode} alt="QR Code" width={100} height={100} />
  </div>
);

const OrderDetailsPage = async ({ params: { id } }: { params: { id: string } }) => {
  const order = await getOrderById(id);

  if (!order) {
    return <div className="wrapper my-8 text-center text-2xl font-bold text-red-500">Order not found 订单未找到</div>;
  }

  const customFieldValuesArray = Array.isArray(order.customFieldValues) 
    ? order.customFieldValues 
    : [order.customFieldValues];

  return (
    <div className="wrapper my-8 max-w-4xl mx-auto">
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
                {group.qrCode && <QRCodeDisplay qrCode={group.qrCode} />}
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
  );
};

export default OrderDetailsPage;