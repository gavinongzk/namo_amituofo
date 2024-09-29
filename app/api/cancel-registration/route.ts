import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { auth } from '@clerk/nextjs';

export async function POST(req: NextRequest) {
  console.log('Cancel registration request received');
  try {
    const { userId } = auth();
    console.log('User ID:', userId);
    if (!userId) {
      console.log('Unauthorized: No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    console.log('Connected to database');

    const { orderId, groupId } = await req.json();
    console.log('Received orderId:', orderId, 'groupId:', groupId);

    const order = await Order.findById(orderId);
    console.log('Found order:', order ? 'Yes' : 'No');
    if (!order) {
      console.log('Order not found');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const group = order.customFieldValues.find((g: any) => g.groupId === groupId);
    console.log('Found group:', group ? 'Yes' : 'No');
    if (!group) {
      console.log('Group not found');
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    group.cancelled = true;
    console.log('Marked group as cancelled');
    await order.save();
    console.log('Saved order');

    // Update event's available seats
    const updatedEvent = await Event.findByIdAndUpdate(order.event, { $inc: { maxSeats: 1 } }, { new: true });
    console.log('Updated event maxSeats:', updatedEvent?.maxSeats);

    console.log('Registration cancelled successfully');
    return NextResponse.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
