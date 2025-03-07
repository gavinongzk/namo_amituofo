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

    // Find the group that's being deleted
    const groupToDelete = order.customFieldValues.find((g: any) => g.groupId === groupId);
    if (!groupToDelete) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Remove the specific group from customFieldValues
    order.customFieldValues = order.customFieldValues.filter((g: any) => g.groupId !== groupId);

    // If there are no more groups, delete the entire order
    if (order.customFieldValues.length === 0) {
      await Order.findByIdAndDelete(orderId);
    } else {
      await order.save();
    }

    // If the registration was cancelled, decrease maxSeats by 1
    // to counter the increase that happened during cancellation
    if (groupToDelete.cancelled) {
      const event = await Event.findById(order.event);
      if (event) {
        event.maxSeats -= 1;
        await event.save();
      }
    }

    return NextResponse.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
