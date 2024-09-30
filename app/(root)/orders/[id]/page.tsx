import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';

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

          <div className="mt-6">
            <h4 className="text-xl font-bold mb-4 text-primary-700">Registration Details 注册详情</h4>
            {customFieldValuesArray.map((group: CustomFieldGroup, index: number) => (
              <div key={group.groupId} className="mb-6 pb-6 border-b last:border-b-0">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
                  {group.queueNumber && (
                    <div className="bg-blue-100 p-3 rounded-xl text-center mb-2 sm:mb-0 w-full sm:w-auto">
                      <p className="text-sm text-blue-600">Queue Number 队列号</p>
                      <p className="text-3xl font-bold text-blue-700">{group.queueNumber}</p>
                    </div>
                  )}
                  <h5 className="text-lg font-semibold text-gray-800">Person 人员 {index + 1}</h5>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;