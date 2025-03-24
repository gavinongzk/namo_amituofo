import React from 'react'
import Search from '@/components/shared/Search'
import { getOrdersByEvent } from '@/lib/actions/order.actions'
import { SearchParamProps } from '@/types'
import { IOrderItem } from '@/lib/database/models/order.model'
import { formatDateTime } from '@/lib/utils'
import DownloadCsvButton from '@/components/shared/DownloadCsvButton'

interface Field {
  label: string;
  value: string;
  type?: string;
}

interface Group {
  fields: Field[];
  groupId: string;
  queueNumber?: string;
}

const Orders = async ({ searchParams }: SearchParamProps) => {
  const eventId = searchParams?.eventId as string | undefined
  const searchText = (searchParams?.query as string) || ''

  let orders: any[] = []
  if (eventId) {
    try {
      orders = await getOrdersByEvent({ eventId, searchString: searchText }) || []
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (searchText === '') return true;
    return order.customFieldValues.some((group: Group) => 
      group.fields.some((field: Field) => 
        (field.label.toLowerCase().includes('name') || field.label.toLowerCase().includes('phone')) && 
        typeof field.value === 'string' && 
        field.value.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  })

  const totalCustomFieldValues = filteredOrders.reduce((total, order) => 
    total + order.customFieldValues.length, 0);

  // Helper function to get unique fields from all orders
  const getUniqueFields = (orders: IOrderItem[]) => {
    const fieldSet = new Set<string>();
    
    orders.forEach(order => {
      order.customFieldValues.forEach(group => {
        group.fields.forEach(field => {
          fieldSet.add(field.label);
        });
      });
    });

    return Array.from(fieldSet);
  };

  // Get unique field labels for table headers
  const uniqueFields = filteredOrders.length > 0 ? getUniqueFields(filteredOrders) : [];

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left animate-fadeIn">Orders</h3>
      </section>

      <section className="wrapper mt-8">
        <Search placeholder="Search by name or phone number..." />
      </section>

      <section className="wrapper overflow-x-auto content-margin my-8">
        {!eventId ? (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8 text-center">
            <p className="text-xl font-semibold">Please select an event to view registrations</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8 text-center">
            <p className="text-xl font-semibold">No registrations found for this event</p>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Event Registrations</h2>
              <p className="mb-2">Total Registrations: {totalCustomFieldValues}</p>
              <DownloadCsvButton 
                eventId={eventId} 
                searchText={searchText} 
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">Queue Number</th>
                    <th className="py-2 px-4 border-b text-left">Event Title</th>
                    <th className="py-2 px-4 border-b text-left">Registration Date</th>
                    {uniqueFields.map(fieldLabel => (
                      <th key={fieldLabel} className="py-2 px-4 border-b text-left">
                        {fieldLabel}
                      </th>
                    ))}
                    <th className="py-2 px-4 border-b text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: IOrderItem) => 
                    order.customFieldValues.map((group, index) => (
                      <tr key={`${order._id}_${group.groupId}`} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-left">{group.queueNumber || 'N/A'}</td>
                        <td className="py-2 px-4 border-b text-left">{order.event.title}</td>
                        <td className="py-2 px-4 border-b text-left">
                          {formatDateTime(order.createdAt).dateTime}
                        </td>
                        {uniqueFields.map(fieldLabel => {
                          const field = group.fields.find(f => f.label === fieldLabel);
                          return (
                            <td key={fieldLabel} className="py-2 px-4 border-b text-left">
                              {field ? (
                                field.type === 'radio' 
                                  ? (field.value === 'yes' ? '是 Yes' : '否 No')
                                  : (field.type === 'boolean'
                                    ? (field.value === 'true' ? '是 Yes' : '否 No')
                                    : field.value || 'N/A')
                              ) : 'N/A'}
                            </td>
                          );
                        })}
                        <td className="py-2 px-4 border-b text-left">
                          <a href={`/reg/${order._id}`} className="text-primary-500 underline hover:text-primary-600 transition-colors duration-200">
                            View Details
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}

export default Orders
