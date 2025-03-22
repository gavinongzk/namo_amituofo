import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { auth } from '@clerk/nextjs';
import { revalidateTag } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

export async function POST(req: NextRequest) {
  console.log('Cancel/Uncancel registration request received');
  try {
    await connectToDatabase();

    // Modified to accept eventId as well
    const { orderId, groupId, queueNumber, eventId, cancelled } = await req.json();
    
    // Ensure cancelled is a boolean
    const cancelledBoolean = !!cancelled;
    
    console.log(`Cancel request params: orderId=${orderId}, groupId=${groupId}, queueNumber=${queueNumber || 'N/A'}, eventId=${eventId || 'N/A'}, cancelled=${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    // Require queueNumber for cancellation operations
    if (!queueNumber) {
      console.error(`Cancel request denied: queueNumber is required`);
      return NextResponse.json({ 
        error: 'queueNumber is required for cancellation operations' 
      }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`Found order: ${order._id}`);
    console.log(`Order customFieldValues before update:`, JSON.stringify(order.customFieldValues, null, 2));

    // Additional validation if eventId is provided
    if (eventId && order.event.toString() !== eventId.toString()) {
      console.error(`Event ID mismatch: provided=${eventId}, order=${order.event}`);
      return NextResponse.json({ error: 'Event ID mismatch' }, { status: 400 });
    }

    // Find the group by queueNumber only (no groupId fallback)
    const group = order.customFieldValues.find(
      (g: CustomFieldGroup) => g.queueNumber === queueNumber
    );
    
    if (group) {
      console.log(`Found group by queueNumber ${queueNumber}. GroupId: ${group.groupId}, Current cancelled status: ${group.cancelled}`);
    } else {
      console.error(`No group found with queueNumber ${queueNumber}`);
      return NextResponse.json({ error: 'Registration not found with provided queueNumber' }, { status: 404 });
    }

    // Make sure current value is boolean
    const currentCancelled = !!group.cancelled;
    
    // Check if the cancelled status is actually changing
    console.log(`Current group.cancelled: ${currentCancelled} (${typeof currentCancelled}), requested cancelled: ${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    if (currentCancelled !== cancelledBoolean) {
      console.log(`Updating cancelled status from ${currentCancelled} to ${cancelledBoolean}`);
      
      // Update using queueNumber (most reliable)
      console.log(`Using updateOne with queueNumber=${queueNumber}`);
      const updateResult = await Order.updateOne(
        { _id: orderId, "customFieldValues.queueNumber": queueNumber },
        { $set: { "customFieldValues.$.cancelled": cancelledBoolean } }
      );
      console.log(`Direct updateOne by queueNumber result:`, updateResult);
      
      // Also update the in-memory model and save
      group.cancelled = cancelledBoolean;
      console.log(`Order customFieldValues before save:`, JSON.stringify(order.customFieldValues.map((g: CustomFieldGroup) => ({
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
      console.log(`Updating registration with queueNumber: ${queueNumber}`);
      
      // Verify the update took effect
      const updatedOrder = await Order.findById(orderId);
      if (updatedOrder) {
        const updatedGroup = updatedOrder.customFieldValues.find(
          (g: CustomFieldGroup) => g.queueNumber === queueNumber
        );
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

    return NextResponse.json({ 
      message: cancelledBoolean ? 'Registration cancelled successfully' : 'Registration uncancelled successfully',
      cancelled: cancelledBoolean,
      groupId: group.groupId, // Return the groupId for reference
      queueNumber: queueNumber, // Return the queueNumber used for identification
      eventId: order.event.toString() // Return the eventId for reference
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
