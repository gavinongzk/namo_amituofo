import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';

interface CustomFieldValue {
  id: string;
  label: string;
  value?: string; // Allow value to be string or undefined
}

interface CustomFieldGroup {
  groupId: string;
  fields: CustomFieldValue[];
  queueNumber?: string; // Add queueNumber to the interface
}

const OrderDetailsPage = async ({ params: { id } }: { params: { id: string } }) => {
  const order = await getOrderById(id);

  if (!order) {
    return <div>Order not found</div>;
  }

  // Use order.customFieldValues directly
  const customFieldValues = order.customFieldValues;

  // Ensure customFieldValues is an array
  const customFieldValuesArray = Array.isArray(customFieldValues) ? customFieldValues : [customFieldValues];

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Order Details</h3>
      </section>

      <div className="wrapper my-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-bold mb-4">Registration Details</h4>
          <p><strong>Event:</strong> {order.event.title}</p>
          <p><strong>Date:</strong> {formatDateTime(order.event.startDateTime).dateOnly} - {formatDateTime(order.event.endDateTime).dateOnly}</p>
          <h5 className="text-lg font-bold mt-4">Queue Numbers</h5>
          {customFieldValuesArray.map((group: CustomFieldGroup) => (
            <div key={group.groupId} className="mb-4">
              {group.queueNumber && (
                <p><strong>Queue Number:</strong> {group.queueNumber}</p>
              )}
              <h6 className="text-md font-semibold mt-2">Group {group.groupId}</h6>
              <ul>
                {group.fields.map((field: CustomFieldValue) => (
                  <li key={field.id}>
                    <strong>{field.label}:</strong> {field.value}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;