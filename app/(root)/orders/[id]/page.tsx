import { getOrderById } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';

interface CustomFieldValue {
  id: string;
  label: string;
  value?: string;
}

interface CustomFieldGroup {
  groupId: string;
  fields: CustomFieldValue[];
  queueNumber?: string;
}

const OrderDetailsPage = async ({ params: { id } }: { params: { id: string } }) => {
  const order = await getOrderById(id);

  if (!order) {
    return <div className="wrapper my-8 text-center">Order not found</div>;
  }

  const customFieldValuesArray = Array.isArray(order.customFieldValues) 
    ? order.customFieldValues 
    : [order.customFieldValues];

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Order Details</h3>
      </section>

      <div className="my-8 grid gap-8 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-bold mb-4">Event Information</h4>
          <p><strong>Event:</strong> {order.event.title}</p>
          <p><strong>Date:</strong> {formatDateTime(order.event.startDateTime).dateOnly} - {formatDateTime(order.event.endDateTime).dateOnly}</p>
          <p><strong>Time:</strong> {formatDateTime(order.event.startDateTime).timeOnly} - {formatDateTime(order.event.endDateTime).timeOnly}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-xl font-bold mb-4">Order Summary</h4>
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Order Date:</strong> {formatDateTime(order.createdAt).dateTime}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h4 className="text-xl font-bold mb-4">Registration Details</h4>
        {customFieldValuesArray.map((group: CustomFieldGroup, index: number) => (
          <div key={group.groupId} className="mb-6 pb-6 border-b last:border-b-0">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-lg font-semibold">Person {index + 1}</h5>
              {group.queueNumber && (
                <span className="bg-primary-50 text-primary-500 px-3 py-1 rounded-full font-medium">
                  Queue Number: {group.queueNumber}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map((field: CustomFieldValue) => (
                <div key={field.id}>
                  <dt className="font-medium text-gray-600">{field.label}</dt>
                  <dd className="mt-1">{field.value || 'N/A'}</dd>
                </div>
<<<<<<< main
              ))}
            </dl>
=======
                <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-xl">
                  {group.fields.map((field: CustomField) => (
                    <div key={field.id} className="flex flex-col hover:bg-gray-100 p-2 rounded transition-colors duration-200">
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
>>>>>>> local
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDetailsPage;