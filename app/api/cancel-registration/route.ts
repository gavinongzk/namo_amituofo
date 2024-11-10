import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { auth } from '@clerk/nextjs';

export async function POST(req: NextRequest) {
  console.log('Cancel/Uncancel registration request received');
  try {

    await connectToDatabase();

    const { orderId, groupId, cancelled } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const group = order.customFieldValues.find((g: any) => g.groupId === groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if the cancelled status is actually changing
    if (group.cancelled !== cancelled) {
      // Update the cancelled status
      group.cancelled = cancelled;
      await order.save();

      // Update event's max seats
      const seatChange = cancelled ? 1 : -1;
      const event = await Event.findByIdAndUpdate(
        order.event,
        { $inc: { maxSeats: seatChange } },
        { new: true }
      );

      if (!event) {
        throw new Error('Event not found');
      }

      console.log(`Updated event maxSeats. New value: ${event.maxSeats}`);
    }

    return NextResponse.json({ 
      message: cancelled ? 'Registration cancelled successfully' : 'Registration uncancelled successfully',
      cancelled: group.cancelled
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
