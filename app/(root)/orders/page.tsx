import React from 'react'
import Search from '@/components/shared/Search'
import { getOrdersByEvent } from '@/lib/actions/order.actions'
import { SearchParamProps } from '@/types'
import { IOrderItem } from '@/lib/database/models/order.model'
import { formatDateTime } from '@/lib/utils'

const Orders = async ({ searchParams }: SearchParamProps) => {
  const eventId = (searchParams?.eventId as string) || ''
  const searchText = (searchParams?.query as string) || ''

  const orders = await getOrdersByEvent({ eventId, searchString: searchText })

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left animate-fadeIn">Orders</h3>
      </section>

      <section className="wrapper mt-8">
        <Search placeholder="Search buyer name..." />
      </section>

      <section className="wrapper overflow-x-auto content-margin my-8">
        {!orders || orders.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8 text-center">
            <p className="text-xl font-semibold">No orders found</p>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Event Orders</h2>
              <p className="mb-2">Total Orders: {orders.length}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">Queue Number</th>
                    <th className="py-2 px-4 border-b text-left">Event Title</th>
                    <th className="py-2 px-4 border-b text-left">Registration Date</th>
                    {orders.length > 0 && orders[0]?.customFieldValues[0]?.fields && 
                      orders[0].customFieldValues[0].fields
                        .filter(field => !['name'].includes(field.label.toLowerCase()))
                        .map(field => (
                          <th key={field.id} className="py-2 px-4 border-b text-left">
                            {field.label}
                          </th>
                        ))
                    }
                    <th className="py-2 px-4 border-b text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: IOrderItem) => (
                    order.customFieldValues.map((group, index) => (
                      <tr key={`${order._id}_${group.groupId}`} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-left">{group.queueNumber || 'N/A'}</td>
                        <td className="py-2 px-4 border-b text-left">{order.event.title}</td>
                        <td className="py-2 px-4 border-b text-left">
                          {formatDateTime(order.createdAt).dateTime}
                        </td>
                        {group.fields
                          .filter(field => !['name'].includes(field.label.toLowerCase()))
                          .map(field => (
                            <td key={field.id} className="py-2 px-4 border-b text-left">
                              {field.type === 'radio'
                                ? (field.value === 'yes' ? '是 Yes' : '否 No')
                                : (field.value || 'N/A')}
                            </td>
                          ))
                        }
                        <td className="py-2 px-4 border-b text-left">
                          <a href={`/orders/${order._id}`} className="text-primary-500 underline hover:text-primary-600 transition-colors duration-200">
                            View Details
                          </a>
                        </td>
                      </tr>
                    ))
                  ))}
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