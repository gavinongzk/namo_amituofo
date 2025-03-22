import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils';
import { revalidateTag } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

export async function POST(req: Request) {
  console.log('Update registration request received');
  try {
    const { eventId, queueNumber, field: fieldId, value, isFromOrderDetails = false } = await req.json();

    console.log(`Update request params: eventId=${eventId || 'N/A'}, queueNumber=${queueNumber || 'N/A'}, fieldId=${fieldId}, value=${value}`);

    // Require queueNumber for registration updates
    if (!queueNumber) {
      console.error(`Update request denied: queueNumber is required`);
      return NextResponse.json(
        { message: 'queueNumber is required for registration updates' },
        { status: 400 }
      );
    }

    // Require eventId
    if (!eventId) {
      console.error(`Update request denied: eventId is required`);
      return NextResponse.json(
        { message: 'eventId is required for registration updates' },
        { status: 400 }
      );
    }

    try {
      console.log('Connecting to database...');
      await connectToDatabase();
      console.log('Database connection successful');

      // First verify the event exists
      console.log(`Finding event with ID: ${eventId}`);
      const event = await Event.findById(eventId);
      if (!event) {
        console.error(`Event not found with ID: ${eventId}`);
        return NextResponse.json(
          { message: 'Event not found' },
          { status: 404 }
        );
      }
      console.log('Event found:', event._id.toString());

      // Find all orders for this event
      console.log(`Finding orders for event: ${eventId}`);
      const orders = await Order.find({ event: eventId });
      if (orders.length === 0) {
        console.error(`No orders found for event: ${eventId}`);
        return NextResponse.json(
          { message: 'No registrations found for this event' },
          { status: 404 }
        );
      }
      console.log(`Found ${orders.length} orders`);

      // Search through all orders to find the one with matching queueNumber
      let foundOrder = null;
      let foundGroup = null;

      console.log(`Searching for registration with queueNumber: ${queueNumber}`);
      for (const orderItem of orders) {
        const group = orderItem.customFieldValues.find((g: CustomFieldGroup) => {
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
        console.error(`No registration found with queueNumber ${queueNumber} for event ${eventId}`);
        return NextResponse.json(
          { message: 'Registration not found with provided queueNumber for this event' },
          { status: 404 }
        );
      }
      console.log(`Found registration with queueNumber ${queueNumber}`);

      // Format phone number if the field being updated is a phone number
      let formattedValue = value;
      if (fieldId.toLowerCase().includes('phone') && typeof value === 'string') {
        if (!isValidPhoneNumber(value)) {
          return NextResponse.json(
            { message: 'Invalid phone number format' },
            { status: 400 }
          );
        }
        formattedValue = formatPhoneNumber(value);
      }

      // Update directly using queueNumber which is the reliable identifier
      try {
        // Find the specific field in the correct group identified by queueNumber
        const fieldToUpdatePath = foundGroup.fields.findIndex((f: CustomField) => f.id === fieldId);
        console.log(`Field to update index: ${fieldToUpdatePath}`);
        
        if (fieldToUpdatePath >= 0) {
          const updatePath = `customFieldValues.$.fields.${fieldToUpdatePath}.value`;
          console.log(`Update path: ${updatePath}`);
          
          // Use findOneAndUpdate for more reliable updates with the $ positional operator
          console.log('Executing findOneAndUpdate...');
          const updateResult = await Order.findOneAndUpdate(
            { _id: foundOrder._id, "customFieldValues.queueNumber": queueNumber },
            { $set: { [updatePath]: formattedValue } },
            { new: true }
          );
          
          console.log(`Update result:`, updateResult ? 'Success' : 'Failed');
          
          if (!updateResult) {
            console.error(`Update failed: No document matched the query criteria`);
            return NextResponse.json(
              { message: 'Registration update failed - no matching document found' },
              { status: 500 }
            );
          }
          
          // Invalidate relevant cache tags to prevent stale data
          console.log('Invalidating cache tags...');
          revalidateTag('order-details');
          revalidateTag('orders');
          revalidateTag('events');
          revalidateTag(`order-${foundOrder._id}`);
          revalidateTag(`event-${event._id}`);
          revalidateTag('registrations');
          
          // Include queueNumber in the response for confirmation
          console.log('Sending success response');
          return NextResponse.json({ 
            success: true,
            queueNumber: queueNumber,
            eventId: event._id.toString()
          });
        }

        console.error(`Field ${fieldId} not found in registration`);
        return NextResponse.json(
          { message: 'Field not found in registration' },
          { status: 404 }
        );
      } catch (error) {
        console.error('Error updating registration field:', error);
        return NextResponse.json(
          { message: 'Failed to update registration field', error: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Database operation error:', error);
      return NextResponse.json(
        { message: 'Database operation failed', error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { message: 'Failed to process request', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
