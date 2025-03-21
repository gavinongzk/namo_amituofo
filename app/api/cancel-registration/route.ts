import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { auth } from '@clerk/nextjs';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  console.log('Cancel/Uncancel registration request received');
  try {
    await connectToDatabase();

    // Modified to accept either groupId or queueNumber
    const { orderId, groupId, queueNumber, cancelled } = await req.json();
    
    if (!groupId && !queueNumber) {
      return NextResponse.json({ error: 'Either groupId or queueNumber must be provided' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Find the group either by groupId or queueNumber
    let group;
    if (groupId) {
      group = order.customFieldValues.find((g: any) => g.groupId === groupId);
    } else if (queueNumber) {
      group = order.customFieldValues.find((g: any) => g.queueNumber === queueNumber);
    }

    if (!group) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
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
      
      // CRITICAL: Ensure cache is properly invalidated to prevent stale data
      // Invalidate all relevant cache tags to ensure fresh data on page refresh
      revalidateTag('order-details');
      revalidateTag('orders');
      revalidateTag('events');
      revalidateTag(`order-${orderId}`); // Add specific order tag
      revalidateTag(`event-${order.event}`); // Add specific event tag
      revalidateTag('registrations'); // Add registrations tag
    }

    return NextResponse.json({ 
      message: cancelled ? 'Registration cancelled successfully' : 'Registration uncancelled successfully',
      cancelled: group.cancelled,
      groupId: group.groupId, // Return the groupId for reference
      queueNumber: group.queueNumber // Return the queueNumber for reference
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
