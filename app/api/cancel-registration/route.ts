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

    // Modified to accept eventId as well
    const { orderId, groupId, queueNumber, eventId, cancelled } = await req.json();
    
    // Ensure cancelled is a boolean
    const cancelledBoolean = !!cancelled;
    
    console.log(`Cancel request params: orderId=${orderId}, groupId=${groupId}, queueNumber=${queueNumber}, cancelled=${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    if (!groupId && !queueNumber) {
      return NextResponse.json({ error: 'Either groupId or queueNumber must be provided' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`Found order: ${order._id}`);
    console.log(`Order customFieldValues before update:`, JSON.stringify(order.customFieldValues, null, 2));

    // Find the group either by groupId or queueNumber
    let group;
    if (queueNumber) {
      // If eventId is provided, ensure it matches the order's event (extra validation)
      if (eventId && order.event.toString() !== eventId.toString()) {
        return NextResponse.json({ error: 'Event ID mismatch' }, { status: 400 });
      }
      group = order.customFieldValues.find((g: any) => g.queueNumber === queueNumber);
      
      if (group) {
        console.log(`Found group by queueNumber ${queueNumber}. GroupId: ${group.groupId}, Current cancelled status: ${group.cancelled}`);
      } else {
        console.log(`No group found with queueNumber ${queueNumber}, falling back to groupId`);
      }
      
      if (!group && groupId) {
        // Fallback to groupId if queueNumber doesn't match
        console.log(`No group found with queueNumber ${queueNumber}, falling back to groupId ${groupId}`);
        group = order.customFieldValues.find((g: any) => g.groupId === groupId);
        if (group) {
          console.log(`Found group by groupId fallback. GroupId: ${group.groupId}, Current cancelled status: ${group.cancelled}`);
        }
      }
    } else if (groupId) {
      group = order.customFieldValues.find((g: any) => g.groupId === groupId);
      if (group) {
        console.log(`Found group by groupId ${groupId}. Current cancelled status: ${group.cancelled}`);
      }
    }

    if (!group) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Make sure current value is boolean
    const currentCancelled = !!group.cancelled;
    
    // Check if the cancelled status is actually changing
    console.log(`Current group.cancelled: ${currentCancelled} (${typeof currentCancelled}), requested cancelled: ${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    if (currentCancelled !== cancelledBoolean) {
      console.log(`Updating cancelled status from ${currentCancelled} to ${cancelledBoolean}`);
      
      // Try both update methods for maximum reliability
      
      // 1. Update directly using updateOne - use queueNumber for more precise targeting
      if (queueNumber) {
        console.log(`Using updateOne with queueNumber=${queueNumber}`);
        const updateResult = await Order.updateOne(
          { _id: orderId, "customFieldValues.queueNumber": queueNumber },
          { $set: { "customFieldValues.$.cancelled": cancelledBoolean } }
        );
        console.log(`Direct updateOne by queueNumber result:`, updateResult);
      }
      
      // 2. Update using groupId as fallback
      console.log(`Using updateOne with groupId=${group.groupId}`);
      const updateResult = await Order.updateOne(
        { _id: orderId, "customFieldValues.groupId": group.groupId },
        { $set: { "customFieldValues.$.cancelled": cancelledBoolean } }
      );
      console.log(`Direct updateOne by groupId result:`, updateResult);
      
      // 3. Also update the in-memory model and save
      group.cancelled = cancelledBoolean;
      console.log(`Order customFieldValues before save:`, JSON.stringify(order.customFieldValues.map((g: any) => ({
        groupId: g.groupId,
        queueNumber: g.queueNumber,
        cancelled: g.cancelled,
        cancelledType: typeof g.cancelled
      })), null, 2));
      
      const saveResult = await order.save();
      console.log(`Save result success:`, !!saveResult);

      // Update event's max seats
      const seatChange = cancelledBoolean ? 1 : -1;
      const event = await Event.findByIdAndUpdate(
        order.event,
        { $inc: { maxSeats: seatChange } },
        { new: true }
      );

      if (!event) {
        throw new Error('Event not found');
      }

      console.log(`Updated event maxSeats. New value: ${event.maxSeats}`);
      console.log(`Updating registration with queueNumber: ${queueNumber || group.queueNumber}, groupId: ${group.groupId}`);
      
      // Verify the update took effect
      const updatedOrder = await Order.findById(orderId);
      if (updatedOrder) {
        const updatedGroup = updatedOrder.customFieldValues.find((g: any) => g.groupId === group.groupId);
        console.log(`After save - group.cancelled: ${updatedGroup?.cancelled} (${typeof updatedGroup?.cancelled})`);
      }
      
      // CRITICAL: Ensure cache is properly invalidated to prevent stale data
      // Invalidate all relevant cache tags to ensure fresh data on page refresh
      revalidateTag('order-details');
      revalidateTag('orders');
      revalidateTag('events');
      revalidateTag(`order-${orderId}`); // Add specific order tag
      revalidateTag(`event-${order.event}`); // Add specific event tag
      revalidateTag('registrations'); // Add registrations tag
    } else {
      console.log(`No change needed: current cancelled status (${currentCancelled}) matches requested status (${cancelledBoolean})`);
    }

    // Important: Use the original queueNumber parameter from the request if it was provided
    // This ensures we return the exact queue number that was requested to be cancelled
    return NextResponse.json({ 
      message: cancelledBoolean ? 'Registration cancelled successfully' : 'Registration uncancelled successfully',
      cancelled: cancelledBoolean,
      groupId: group.groupId, // Return the groupId for reference
      queueNumber: queueNumber || group.queueNumber, // Return the original requested queueNumber if it was provided
      eventId: order.event.toString() // Return the eventId for reference
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
