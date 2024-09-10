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
    return <div>Order not found</div>;
  }

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Thank You for Registering!</h3>
      </section>

      <div className="wrapper my-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-bold mb-4">Registration Details</h4>
          <p><strong>Event:</strong> {order.event.title}</p>
          <p><strong>Date:</strong> {formatDateTime(order.event.startDateTime).dateOnly} - {formatDateTime(order.event.endDateTime).dateOnly}</p>
          {order.event.registrationSuccessMessage && (
            <p className="mt-4 text-lg">{order.event.registrationSuccessMessage}</p>
          )}
          <h5 className="text-lg font-bold mt-4">Custom Fields</h5>
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