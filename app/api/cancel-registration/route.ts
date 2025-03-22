import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { revalidateTag } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

export async function POST(req: NextRequest) {
  console.log('Cancel/Uncancel registration request received');
  try {
    await connectToDatabase();

    // Modified to make orderId optional if eventId and queueNumber are provided
    const { orderId, groupId, queueNumber, eventId, cancelled } = await req.json();
    
    // Ensure cancelled is a boolean
    const cancelledBoolean = !!cancelled;
    
    console.log(`Cancel request params: orderId=${orderId || 'N/A'}, groupId=${groupId || 'N/A'}, queueNumber=${queueNumber || 'N/A'}, eventId=${eventId || 'N/A'}, cancelled=${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    // Require queueNumber for cancellation operations
    if (!queueNumber) {
      console.error(`Cancel request denied: queueNumber is required`);
      return NextResponse.json({ 
        error: 'queueNumber is required for cancellation operations' 
      }, { status: 400 });
    }

    // Also require either orderId or eventId
    if (!orderId && !eventId) {
      console.error(`Cancel request denied: either orderId or eventId is required`);
      return NextResponse.json({ 
        error: 'Either orderId or eventId is required for cancellation operations' 
      }, { status: 400 });
    }

    let order;
    let eventObject;
    const normalizedQueueNumber = String(queueNumber).replace(/^0+/, '');

    // If orderId is provided, try to find the order directly
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        console.error(`Order not found with ID: ${orderId}`);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      console.log(`Found order by ID: ${order._id}`);
    } 
    // If eventId is provided but no orderId, search all orders for this event with matching queueNumber
    else if (eventId) {
      console.log(`Searching for registration with eventId=${eventId} and queueNumber=${queueNumber}`);
      
      // First verify the event exists
      eventObject = await Event.findById(eventId);
      if (!eventObject) {
        console.error(`Event not found with ID: ${eventId}`);
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      
      // Find all orders for this event
      const orders = await Order.find({ event: eventId });
      if (orders.length === 0) {
        console.error(`No orders found for event: ${eventId}`);
        return NextResponse.json({ error: 'No registrations found for this event' }, { status: 404 });
      }
      
      console.log(`Found ${orders.length} orders for event ${eventId}, searching for queueNumber ${queueNumber}`);
      
      // Search through all orders to find the one with matching queueNumber
      let foundOrder = null;
      let foundGroup = null;
      
      for (const orderItem of orders) {
        const group = orderItem.customFieldValues.find((g: CustomFieldGroup) => {
          const normalizedGroupQueueNumber = String(g.queueNumber).replace(/^0+/, '');
          return normalizedGroupQueueNumber === normalizedQueueNumber;
        });
        
        if (group) {
          foundOrder = orderItem;
          foundGroup = group;
          break;
        }
      }
      
      if (!foundOrder || !foundGroup) {
        console.error(`No registration found with queueNumber ${queueNumber} for event ${eventId}`);
        return NextResponse.json({ 
          error: 'Registration not found with provided queueNumber for this event' 
        }, { status: 404 });
      }
      
      order = foundOrder;
      console.log(`Found order by event and queueNumber: ${order._id}`);
    }

    console.log(`Order customFieldValues before update:`, JSON.stringify(order.customFieldValues, null, 2));

    // Additional validation if eventId is provided with orderId
    if (orderId && eventId && order.event.toString() !== eventId.toString()) {
      console.error(`Event ID mismatch: provided=${eventId}, order=${order.event}`);
      return NextResponse.json({ error: 'Event ID mismatch' }, { status: 400 });
    }

    // Find the group by queueNumber only (no groupId fallback)
    const group = order.customFieldValues.find(
      (g: CustomFieldGroup) => {
        const normalizedGroupQueueNumber = String(g.queueNumber).replace(/^0+/, '');
        return normalizedGroupQueueNumber === normalizedQueueNumber;
      }
    );
    
    if (group) {
      console.log(`Found group by queueNumber ${queueNumber}. GroupId: ${group.groupId}, Current cancelled status: ${group.cancelled}`);
    } else {
      console.error(`No group found with queueNumber ${queueNumber}. Available queueNumbers:`, 
        order.customFieldValues.map((g: CustomFieldGroup) => g.queueNumber));
      return NextResponse.json({ error: 'Registration not found with provided queueNumber' }, { status: 404 });
    }

    // Make sure current value is boolean
    const currentCancelled = !!group.cancelled;
    
    // Check if the cancelled status is actually changing
    console.log(`Current group.cancelled: ${currentCancelled} (${typeof currentCancelled}), requested cancelled: ${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    if (currentCancelled !== cancelledBoolean) {
      console.log(`Updating cancelled status from ${currentCancelled} to ${cancelledBoolean}`);
      
      // Update using queueNumber (most reliable)
      // Use the same normalization approach for MongoDB query
      console.log(`Using updateOne with queueNumber=${queueNumber}`);
      
      // First try exact match (more reliable if formats match)
      let updateResult = await Order.updateOne(
        { _id: order._id, "customFieldValues.queueNumber": queueNumber },
        { $set: { "customFieldValues.$.cancelled": cancelledBoolean } }
      );
      
      // If no documents were modified, try a more flexible approach
      if (updateResult.modifiedCount === 0) {
        console.log(`No documents updated with exact queueNumber match. Trying with $or query.`);
        
        // Try to update with different possible formats of the same queueNumber
        // This handles cases where queueNumber might be stored as string or number
        updateResult = await Order.updateOne(
          { 
            _id: order._id, 
            $or: [
              { "customFieldValues.queueNumber": queueNumber },
              { "customFieldValues.queueNumber": String(queueNumber) },
              { "customFieldValues.queueNumber": Number(queueNumber) },
              { "customFieldValues.queueNumber": queueNumber.replace(/^0+/, '') }
            ]
          },
          { $set: { "customFieldValues.$.cancelled": cancelledBoolean } }
        );
      }
      
      console.log(`Direct updateOne result:`, updateResult);
      
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
      const eventToUpdate = eventObject || await Event.findById(order.event);

      if (!eventToUpdate) {
        throw new Error('Event not found');
      }

      eventToUpdate.maxSeats += seatChange;
      await eventToUpdate.save();

      console.log(`Updated event maxSeats. New value: ${eventToUpdate.maxSeats}`);
      console.log(`Updating registration with queueNumber: ${queueNumber}`);
      
      // Verify the update took effect
      const updatedOrder = await Order.findById(order._id);
      if (updatedOrder) {
        const updatedGroup = updatedOrder.customFieldValues.find(
          (g: CustomFieldGroup) => {
            const normalizedGroupQueueNumber = String(g.queueNumber).replace(/^0+/, '');
            return normalizedGroupQueueNumber === normalizedQueueNumber;
          }
        );
        console.log(`After save - group.cancelled: ${updatedGroup?.cancelled} (${typeof updatedGroup?.cancelled})`);
      }
      
      // CRITICAL: Ensure cache is properly invalidated to prevent stale data
      // Invalidate all relevant cache tags to ensure fresh data on page refresh
      revalidateTag('order-details');
      revalidateTag('orders');
      revalidateTag('events');
      if (orderId) revalidateTag(`order-${orderId}`);
      revalidateTag(`event-${order.event}`);
      revalidateTag('registrations');
    } else {
      console.log(`No change needed: current cancelled status (${currentCancelled}) matches requested status (${cancelledBoolean})`);
    }

    return NextResponse.json({ 
      message: cancelledBoolean ? 'Registration cancelled successfully' : 'Registration uncancelled successfully',
      cancelled: cancelledBoolean,
      groupId: group.groupId,
      queueNumber: queueNumber,
      eventId: order.event.toString(),
      orderId: order._id.toString()
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
