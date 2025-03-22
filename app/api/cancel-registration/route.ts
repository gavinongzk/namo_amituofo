import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { revalidateTag } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log('Cancel/Uncancel registration request received');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  try {
    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    await connectToDatabase();

    const { eventId, queueNumber, cancelled } = await req.json();
    
    // Ensure cancelled is a boolean
    const cancelledBoolean = !!cancelled;
    
    console.log(`Cancel request params: eventId=${eventId || 'N/A'}, queueNumber=${queueNumber || 'N/A'}, cancelled=${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    // Require queueNumber for cancellation operations
    if (!queueNumber) {
      console.error(`Cancel request denied: queueNumber is required`);
      return NextResponse.json({ 
        error: 'queueNumber is required for cancellation operations' 
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Require eventId
    if (!eventId) {
      console.error(`Cancel request denied: eventId is required`);
      return NextResponse.json({ 
        error: 'eventId is required for cancellation operations' 
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // First verify the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.error(`Event not found with ID: ${eventId}`);
      return NextResponse.json({ error: 'Event not found' }, { 
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Find all orders for this event
    const orders = await Order.find({ event: eventId });
    if (orders.length === 0) {
      console.error(`No orders found for event: ${eventId}`);
      return NextResponse.json({ error: 'No registrations found for this event' }, { 
        status: 404,
        headers: corsHeaders
      });
    }
    
    console.log(`Found ${orders.length} orders for event ${eventId}, searching for queueNumber ${queueNumber}`);
    
    // Search through all orders to find the one with matching queueNumber
    let foundOrder = null;
    let foundGroup = null;
    
    for (const orderItem of orders) {
      const group = orderItem.customFieldValues.find((g: CustomFieldGroup) => {
        const normalizedGroupQueueNumber = String(g.queueNumber).replace(/^0+/, '');
        const normalizedSearchQueueNumber = String(queueNumber).replace(/^0+/, '');
        return normalizedGroupQueueNumber === normalizedSearchQueueNumber;
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
      }, { 
        status: 404,
        headers: corsHeaders
      });
    }

    // Make sure current value is boolean
    const currentCancelled = !!foundGroup.cancelled;
    
    // Check if the cancelled status is actually changing
    console.log(`Current group.cancelled: ${currentCancelled} (${typeof currentCancelled}), requested cancelled: ${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    if (currentCancelled !== cancelledBoolean) {
      console.log(`Updating cancelled status from ${currentCancelled} to ${cancelledBoolean}`);
      
      // Update using queueNumber (most reliable)
      console.log(`Using updateOne with queueNumber=${queueNumber}`);
      
      // First try exact match (more reliable if formats match)
      let updateResult = await Order.updateOne(
        { _id: foundOrder._id, "customFieldValues.queueNumber": queueNumber },
        { $set: { "customFieldValues.$.cancelled": cancelledBoolean } }
      );
      
      // If no documents were modified, try a more flexible approach
      if (updateResult.modifiedCount === 0) {
        console.log(`No documents updated with exact queueNumber match. Trying with $or query.`);
        
        // Try to update with different possible formats of the same queueNumber
        updateResult = await Order.updateOne(
          { 
            _id: foundOrder._id, 
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
      foundGroup.cancelled = cancelledBoolean;
      const saveResult = await foundOrder.save();
      console.log(`Save result success:`, !!saveResult);

      // Update event's max seats
      const seatChange = cancelledBoolean ? 1 : -1;
      event.maxSeats += seatChange;
      await event.save();

      console.log(`Updated event maxSeats. New value: ${event.maxSeats}`);
      console.log(`Updating registration with queueNumber: ${queueNumber}`);
      
      // Verify the update took effect
      const updatedOrder = await Order.findById(foundOrder._id);
      if (updatedOrder) {
        const updatedGroup = updatedOrder.customFieldValues.find(
          (g: CustomFieldGroup) => {
            const normalizedGroupQueueNumber = String(g.queueNumber).replace(/^0+/, '');
            const normalizedSearchQueueNumber = String(queueNumber).replace(/^0+/, '');
            return normalizedGroupQueueNumber === normalizedSearchQueueNumber;
          }
        );
        console.log(`After save - group.cancelled: ${updatedGroup?.cancelled} (${typeof updatedGroup?.cancelled})`);
      }
      
      // CRITICAL: Ensure cache is properly invalidated to prevent stale data
      // Invalidate all relevant cache tags to ensure fresh data on page refresh
      revalidateTag('order-details');
      revalidateTag('orders');
      revalidateTag('events');
      revalidateTag(`order-${foundOrder._id}`);
      revalidateTag(`event-${event._id}`);
      revalidateTag('registrations');
    } else {
      console.log(`No change needed: current cancelled status (${currentCancelled}) matches requested status (${cancelledBoolean})`);
    }

    return NextResponse.json({ 
      message: cancelledBoolean ? 'Registration cancelled successfully' : 'Registration uncancelled successfully',
      cancelled: cancelledBoolean,
      queueNumber: queueNumber,
      eventId: event._id.toString()
    }, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}
