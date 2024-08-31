import React from 'react'
import { IEvent } from '@/lib/database/models/event.model';
import { Button } from '../ui/button';
import { createOrder } from '@/lib/actions/order.actions';

const Checkout = ({ event, userId }: { event: IEvent, userId: string }) => {
  const onCheckout = async () => {
    const order = {
      eventId: event._id,
      buyerId: userId,
      createdAt: new Date(),
    }

    await createOrder(order);
  }

  return (
    <form action={onCheckout} method="post">
      <Button type="submit" role="link" size="lg" className="button sm:w-fit">
        Register for Event
      </Button>
    </form>
  )
}

export default Checkout