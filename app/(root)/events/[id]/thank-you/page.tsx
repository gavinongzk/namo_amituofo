import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';

interface CustomFieldValue {
  id: string;
  label: string;
  value: string;
}

const ThankYouPage = async ({ params: { id }, searchParams }: { params: { id: string }, searchParams: { orderId: string } }) => {
  const order = await getOrderById(searchParams.orderId);

  if (!order) {
    return <div>Order not found 订单未找到</div>;
  }

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Thank You for Registering! 感谢您的注册！</h3>
      </section>

      <div className="wrapper my-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6 p-4 bg-blue-100 rounded-lg text-center">
            <h4 className="text-2xl font-bold text-blue-800">Your Queue Number 您的排队号码</h4>
            <p className="text-4xl font-bold text-blue-600 mt-2">{order.queueNumber}</p>
          </div>

          <h4 className="text-xl font-bold mb-4">Registration Details 注册详情</h4>
          <p><strong>Event 活动:</strong> {order.event.title}</p>
          <p><strong>Date 日期:</strong> {formatDateTime(order.event.startDateTime).dateOnly} - {formatDateTime(order.event.endDateTime).dateOnly}</p>
          {order.event.registrationSuccessMessage && (
            <p className="mt-4 text-lg">{order.event.registrationSuccessMessage}</p>
          )}
          <h5 className="text-lg font-bold mt-4">Custom Fields 自定义字段</h5>
          <ul>
            {order.customFieldValues.map((field: CustomFieldValue) => (
              <li key={field.id}>
                <strong>{field.label}:</strong> {field.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;