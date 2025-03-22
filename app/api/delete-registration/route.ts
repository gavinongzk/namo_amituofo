import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { auth } from '@clerk/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { eventId, queueNumber } = await req.json();

    if (!queueNumber) {
      return NextResponse.json({ error: 'queueNumber must be provided' }, { status: 400 });
    }

    if (!eventId) {
      return NextResponse.json({ error: 'eventId must be provided' }, { status: 400 });
    }

    // First verify the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find all orders for this event
    const orders = await Order.find({ event: eventId });
    if (orders.length === 0) {
      return NextResponse.json({ error: 'No registrations found for this event' }, { status: 404 });
    }

    // Search through all orders to find the one with matching queueNumber
    let foundOrder = null;
    let foundGroup = null;

    for (const orderItem of orders) {
      const group = orderItem.customFieldValues.find((g: any) => {
        // Compare queue numbers exactly as strings to preserve leading zeros
        return String(g.queueNumber) === String(queueNumber);
      });

      if (group) {
        foundOrder = orderItem;
        foundGroup = group;
        break;
      }
    }

    if (!foundOrder || !foundGroup) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Remove the specific group from customFieldValues
    foundOrder.customFieldValues = foundOrder.customFieldValues.filter((g: any) => g.queueNumber !== queueNumber);

    // If there are no more groups, delete the entire order
    if (foundOrder.customFieldValues.length === 0) {
      await Order.findByIdAndDelete(foundOrder._id);
    } else {
      await foundOrder.save();
    }

    // If the registration was cancelled, decrease maxSeats by 1
    // to counter the increase that happened during cancellation
    if (foundGroup.cancelled) {
      event.maxSeats -= 1;
      await event.save();
    }

    return NextResponse.json({ 
      message: 'Registration deleted successfully',
      queueNumber: queueNumber,
      eventId: event._id.toString()
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
