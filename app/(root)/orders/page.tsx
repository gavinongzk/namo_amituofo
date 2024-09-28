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

      <section className="wrapper overflow-x-auto content-margin">
        <table className="w-full border-collapse border-t">
          <thead>
            <tr className="p-medium-14 border-b text-grey-500 bg-gray-50">
              <th className="min-w-[200px] py-3 px-4 text-left">Event Title</th>
              <th className="min-w-[150px] py-3 px-4 text-left">Queue Number</th>
              <th className="min-w-[150px] py-3 px-4 text-left">Attendance</th>
              <th className="min-w-[150px] py-3 px-4 text-left">Registration Date</th>
              <th className="min-w-[150px] py-3 px-4 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {orders && orders.map((order: IOrderItem) => (
              <tr key={order._id} className="p-regular-14 lg:p-regular-16 border-b hover:bg-gray-50 transition-colors duration-200">
                <td className="min-w-[200px] py-4 px-4 text-left">{order.event.title}</td>
                <td className="min-w-[150px] py-4 px-4 text-left">{order.customFieldValues[0]?.queueNumber || 'N/A'}</td> 
                <td className="min-w-[150px] py-4 px-4 text-left">{order.customFieldValues[0]?.attendance ? "Yes" : "No"}</td>
                <td className="min-w-[150px] py-4 px-4 text-left">
                  {formatDateTime(order.createdAt).dateTime}
                </td>
                <td className="min-w-[150px] py-4 px-4 text-left">
                  <a href={`/orders/${order._id}`} className="text-primary-500 underline hover:text-primary-600 transition-colors duration-200">
                    View Details
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

export default Orders