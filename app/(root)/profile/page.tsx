import Collection from '@/components/shared/Collection'
import { Button } from '@/components/ui/button'
import { getEventsByUser } from '@/lib/actions/event.actions'
import { getOrdersByUser } from '@/lib/actions/order.actions'
import { IOrder } from '@/lib/database/models/order.model'
import { IEvent } from '@/lib/database/models/event.model'
import { SearchParamProps } from '@/types'
import { auth, currentUser } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'

const ProfilePage = async ({ searchParams }: SearchParamProps) => {
  const user = await currentUser();
  const userId = user?.publicMetadata.userId as string;

  const ordersPage = Number(searchParams?.ordersPage) || 1;
  const eventsPage = Number(searchParams?.eventsPage) || 1;

  const orders = await getOrdersByUser({ userId, page: ordersPage });

  // Group orders by event
  const groupedOrders = orders?.data.reduce((acc: { [key: string]: IOrder[] }, order: IOrder) => {
    if (order && order.event) {
      if (!acc[order.event._id]) {
        acc[order.event._id] = [];
      }
      acc[order.event._id].push(order);
    }
    return acc;
  }, {});

  const organizedEvents = await getEventsByUser({ userId, page: eventsPage });

  return (
    <>
      {/* My Tickets */}
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>My Tickets</h3>
          <Button asChild size="lg" className="button hidden sm:flex">
            <Link href="/#events">
              Explore More Events
            </Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8">
        {groupedOrders && Object.keys(groupedOrders).length > 0 ? (
          Object.keys(groupedOrders).map(eventId => {
            const eventOrders = groupedOrders[eventId];
            const event = eventOrders[0].event; // Assuming all orders have the same event details
            return (
              <div key={eventId} className="mb-8">
                <h4 className="h4-bold">{event.title}</h4>
                <Collection 
                  data={eventOrders.map((order: IOrder) => ({ ...order.event, orderId: order._id }))}
                  emptyTitle="No tickets found"
                  emptyStateSubtext="No worries - plenty of exciting events to explore!"
                  collectionType="My_Tickets"
                  limit={3}
                  page={ordersPage}
                  urlParamName="ordersPage"
                  totalPages={orders?.totalPages}
                />
              </div>
            );
          })
        ) : (
          <div className="flex-center wrapper min-h-[200px] w-full flex-col gap-3 rounded-[14px] bg-grey-50 py-28 text-center">
            <h3 className="p-bold-20 md:h5-bold">No event tickets purchased yet</h3>
            <p className="p-regular-14">No worries - plenty of exciting events to explore!</p>
          </div>
        )}
      </section>

      {/* Events Organized */}
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>Events Organized</h3>
          <Button asChild size="lg" className="button hidden sm:flex">
            <Link href="/events/create">
              Create New Event
            </Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8">
        <Collection 
          data={organizedEvents?.data}
          emptyTitle="No events have been created yet"
          emptyStateSubtext="Go create some now"
          collectionType="Events_Organized"
          limit={3}
          page={eventsPage}
          urlParamName="eventsPage"
          totalPages={organizedEvents?.totalPages}
        />
      </section>
    </>
  )
}

export default ProfilePage