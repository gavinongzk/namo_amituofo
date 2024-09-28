import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';
import { CustomFieldGroup, CustomField } from '@/types';


const ThankYouPage = async ({ params: { id }, searchParams }: { params: { id: string }, searchParams: { orderId: string } }) => {
  const order = await getOrderById(searchParams.orderId);

  if (!order) {
    return <div>Order not found 订单未找到</div>;
  }

  // Use order.customFieldValues directly
  const customFieldValues = order.customFieldValues;

  // Ensure customFieldValues is an array
  const customFieldValuesArray = Array.isArray(customFieldValues) ? customFieldValues : [customFieldValues];

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Thank You</h3>
      </section>

      <div className="wrapper my-8">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p className="font-bold">Registration Successful! 注册成功！</p>
          <p>Your registration has been confirmed. 您的注册已确认。</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-bold mb-4">Registration Details 注册详情</h4>
          <p><strong>Event 活动:</strong> {order.event.title}</p>
          <p><strong>Date 日期:</strong> {formatDateTime(order.event.startDateTime).dateOnly} - {formatDateTime(order.event.endDateTime).dateOnly}</p>
          {order.event.registrationSuccessMessage && (
            <p className="mt-4 text-lg">{order.event.registrationSuccessMessage}</p>
          )}
          <h5 className="text-lg font-bold mt-4">Custom Fields 自定义字段</h5>
          {customFieldValuesArray.map((group: CustomFieldGroup) => (
            <div key={group.groupId} className="mb-4">
              <h6 className="text-md font-semibold">{group.groupId}</h6>
              {group.queueNumber && (
                <p><strong>Queue Number:</strong> {group.queueNumber}</p>
              )}
              <ul>
                {group.fields.map((field: CustomField) => (
                  <li key={field.id}>
                    <strong>{field.label}:</strong> {field.value}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {order.event.registrationSuccessMessage && (
            <p className="mt-4 text-lg">{order.event.registrationSuccessMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;