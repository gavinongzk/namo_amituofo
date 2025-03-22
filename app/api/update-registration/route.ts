import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils';
import { revalidateTag } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

export async function POST(req: Request) {
  console.log('Update registration request received');
  try {
    const { orderId, groupId, queueNumber, eventId, field: fieldId, value, isFromOrderDetails = false } = await req.json();

    console.log(`Update request params: orderId=${orderId}, groupId=${groupId}, queueNumber=${queueNumber || 'N/A'}, fieldId=${fieldId}, eventId=${eventId || 'N/A'}`);

    // Require queueNumber for registration updates
    if (!queueNumber) {
      console.error(`Update request denied: queueNumber is required`);
      return NextResponse.json(
        { message: 'queueNumber is required for registration updates' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.findById(orderId);
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Additional validation if eventId is provided
    if (eventId && order.event.toString() !== eventId.toString()) {
      console.error(`Event ID mismatch: provided=${eventId}, order=${order.event}`);
      return NextResponse.json(
        { message: 'Event ID mismatch' },
        { status: 400 }
      );
    }

    // Find the group by queueNumber only - groupId alone is not reliable
    const group = order.customFieldValues.find(
      (g: CustomFieldGroup) => g.queueNumber === queueNumber
    );
    
    if (group) {
      console.log(`Found group by queueNumber ${queueNumber}. GroupId: ${group.groupId}`);
    } else {
      console.error(`No group found with queueNumber ${queueNumber}`);
      return NextResponse.json(
        { message: 'Registration not found with provided queueNumber' },
        { status: 404 }
      );
    }

    const fieldData = group.fields.find((f: any) => f.id === fieldId);
    
    if (!fieldData) {
      console.error(`Field not found: fieldId=${fieldId}`);
      return NextResponse.json(
        { message: 'Field not found' },
        { status: 404 }
      );
    }

    // Now we can safely check the field label
    let formattedValue = value;
    if (!isFromOrderDetails && (fieldData.label.toLowerCase().includes('phone') || 
        fieldData.label.toLowerCase().includes('contact'))) {
      formattedValue = formatPhoneNumber(value);
      if (!isValidPhoneNumber(formattedValue)) {
        console.error(`Invalid phone number: ${value}`);
        return NextResponse.json(
          { message: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    console.log(`Updating field "${fieldData.label}" with value: ${formattedValue} (original: ${fieldData.value})`);

    // Update directly using queueNumber which is the reliable identifier
    try {
      // Find the specific field in the correct group identified by queueNumber
      const fieldToUpdatePath = group.fields.findIndex((f: CustomField) => f.id === fieldId);
      if (fieldToUpdatePath >= 0) {
        const updatePath = `customFieldValues.$.fields.${fieldToUpdatePath}.value`;
        
        // Use findOneAndUpdate for more reliable updates with the $ positional operator
        const updateResult = await Order.findOneAndUpdate(
          { _id: orderId, "customFieldValues.queueNumber": queueNumber },
          { $set: { [updatePath]: formattedValue } },
          { new: true } // Return the updated document
        );
        
        console.log(`Direct findOneAndUpdate by queueNumber result:`, !!updateResult);
        
        if (!updateResult) {
          console.error(`Update failed: No document matched the query criteria`);
          return NextResponse.json(
            { message: 'Registration update failed - no matching document found' },
            { status: 500 }
          );
        }
        
        // Skip the redundant in-memory model update and save since we already have the updated document
        order = updateResult;
      } else {
        console.error(`Field index not found for fieldId=${fieldId}`);
        return NextResponse.json(
          { message: 'Field not found in registration' },
          { status: 404 }
        );
      }
    } catch (err) {
      console.error('Error in queueNumber-based update:', err);
      return NextResponse.json(
        { message: 'Error updating registration field' },
        { status: 500 }
      );
    }

    // Skip the redundant in-memory model update and save
    // Instead, verify the update took effect directly from the updated document

    // Invalidate relevant cache tags to prevent stale data
    revalidateTag('order-details');
    revalidateTag('orders');
    revalidateTag('events');
    revalidateTag(`order-${orderId}`); // Add specific order tag
    revalidateTag(`event-${order.event}`); // Add specific event tag
    revalidateTag('registrations'); // Add registrations tag
    
    // Include groupId and queueNumber in the response for confirmation
    return NextResponse.json({ 
      success: true,
      groupId: group.groupId,
      queueNumber: queueNumber,
      eventId: order.event.toString()
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { message: 'Error updating registration' },
      { status: 500 }
    );
  }
}
