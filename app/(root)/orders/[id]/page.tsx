import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';

const OrderDetailsPage = async ({ params: { id } }: { params: { id: string } }) => {
  const order = await getOrderById(id);

  if (!order) {
    return <div className="wrapper my-8 text-center">Order not found 订单未找到</div>;
  }

  const customFieldValuesArray = Array.isArray(order.customFieldValues) 
    ? order.customFieldValues 
    : [order.customFieldValues];

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">
          Registration Successful. Registration Details<br />
          注册成功。注册详情
        </h3>
      </section>

      <div className="my-8 grid gap-8 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-bold mb-4">Event Information 活动信息</h4>
          <p><strong>Event 活动:</strong> {order.event.title}</p>
          <p><strong>Date 日期:</strong> {formatDateTime(order.event.startDateTime).dateOnly} - {formatDateTime(order.event.endDateTime).dateOnly}</p>
          <p><strong>Time 时间:</strong> {formatDateTime(order.event.startDateTime).timeOnly} - {formatDateTime(order.event.endDateTime).timeOnly}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-bold mb-4">Order Summary 订单摘要</h4>
          <p><strong>Order ID 订单号:</strong> {order._id}</p>
          <p><strong>Order Date 订单日期:</strong> {formatDateTime(order.createdAt).dateTime}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h4 className="text-xl font-bold mb-4">Registration Details 注册详情</h4>
        {customFieldValuesArray.map((group: CustomFieldGroup, index: number) => (
          <div key={group.groupId} className="mb-6 pb-6 border-b last:border-b-0">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-lg font-semibold">Person 人员 {index + 1}</h5>
              {group.queueNumber && (
                <span className="bg-primary-50 text-primary-500 px-3 py-1 rounded-full font-medium">
                  Queue Number 队列号: {group.queueNumber}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map((field: CustomField) => (
                <div key={field.id}>
                  <dt className="font-medium text-gray-600">{field.label}</dt>
                  <dd className="mt-1">{field.value || 'N/A'}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDetailsPage;