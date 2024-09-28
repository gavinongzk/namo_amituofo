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
      <section className="bg-gradient-to-r from-primary-50 to-primary-100 bg-dotted-pattern bg-cover bg-center py-8 md:py-12 rounded-t-2xl">
        <h3 className="text-3xl font-bold text-center text-primary-500">
          Registration Successful 注册成功
        </h3>
      </section>

      <div className="bg-white shadow-lg rounded-b-2xl overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="text-xl font-bold mb-4 text-primary-700">Event Information 活动信息</h4>
              <p className="mb-2"><span className="font-semibold">Event 活动:</span> {order.event.title}</p>
              <p className="mb-2"><span className="font-semibold">Date 日期:</span> {formatDateTime(order.event.startDateTime).dateOnly} - {formatDateTime(order.event.endDateTime).dateOnly}</p>
              <p><span className="font-semibold">Time 时间:</span> {formatDateTime(order.event.startDateTime).timeOnly} - {formatDateTime(order.event.endDateTime).timeOnly}</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="text-xl font-bold mb-4 text-primary-700">Order Summary 订单摘要</h4>
              <p className="mb-2"><span className="font-semibold">Order ID 订单号:</span> {order._id}</p>
              <p><span className="font-semibold">Order Date 订单日期:</span> {formatDateTime(order.createdAt).dateTime}</p>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-2xl font-bold mb-6 text-primary-700">Registration Details 注册详情</h4>
            {customFieldValuesArray.map((group: CustomFieldGroup, index: number) => (
              <div key={group.groupId} className="mb-8 pb-8 border-b last:border-b-0">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-xl font-semibold text-gray-800">Person 人员 {index + 1}</h5>
                  {group.queueNumber && (
                    <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full font-medium text-lg">
                      Queue Number 队列号: {group.queueNumber}
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl">
                  {group.fields.map((field: CustomField) => (
                    <div key={field.id} className="flex flex-col">
                      <dt className="font-medium text-gray-600 mb-1">{field.label}</dt>
                      <dd className="text-gray-900 font-semibold">{field.value || 'N/A'}</dd>
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