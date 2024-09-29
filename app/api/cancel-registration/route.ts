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
    const { orderId, groupId } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const group = order.customFieldValues.find((g: any) => g.groupId === groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    group.cancelled = true;
    await order.save();

    // Update event's available seats
    await Event.findByIdAndUpdate(order.event, { $inc: { maxSeats: 1 } });

    return NextResponse.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
