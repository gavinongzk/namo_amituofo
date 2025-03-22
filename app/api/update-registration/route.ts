import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils';
import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  console.log('Update registration request received');
  try {
    const { orderId, groupId, queueNumber, eventId, field: fieldId, value, isFromOrderDetails = false } = await req.json();

    console.log(`Update request params: orderId=${orderId}, groupId=${groupId}, queueNumber=${queueNumber || 'N/A'}, fieldId=${fieldId}, eventId=${eventId || 'N/A'}`);

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

    // Find the group using both queueNumber and groupId if available
    let group;
    
    if (queueNumber) {
      // Try to find by queueNumber first, which is more reliable
      group = order.customFieldValues.find(
        (g: any) => g.queueNumber === queueNumber
      );
      
      if (group) {
        console.log(`Found group by queueNumber ${queueNumber}. GroupId: ${group.groupId}`);
      } else {
        console.warn(`No group found with queueNumber ${queueNumber}`);
      }
    }
    
    // If we couldn't find by queueNumber or it wasn't provided, use groupId as fallback
    if (!group && groupId) {
      console.log(`Falling back to groupId lookup: ${groupId}`);
      group = order.customFieldValues.find(
        (g: any) => g.groupId === groupId
      );
      
      if (group) {
        console.log(`Found group by groupId fallback. GroupId: ${group.groupId}`);
      }
    }
    
    if (!group) {
      console.error(`Group not found for orderId=${orderId}, groupId=${groupId}, queueNumber=${queueNumber || 'N/A'}`);
      return NextResponse.json(
        { message: 'Group not found' },
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

    // Try both update methods for maximum reliability, same as in cancel-registration

    // 1. Update directly using updateOne with queueNumber (most precise)
    if (queueNumber) {
      console.log(`Using updateOne with queueNumber=${queueNumber}`);
      const updateResult = await Order.updateOne(
        { _id: orderId, "customFieldValues.queueNumber": queueNumber },
        { $set: { [`customFieldValues.$.fields.$[field].value`]: formattedValue } },
        { arrayFilters: [{ "field.id": fieldId }] }
      );
      console.log(`Direct updateOne by queueNumber result:`, updateResult);
    }
    
    // 2. Update using groupId as fallback
    console.log(`Using updateOne with groupId=${group.groupId}`);
    const updateResult = await Order.updateOne(
      { _id: orderId, "customFieldValues.groupId": group.groupId },
      { $set: { [`customFieldValues.$.fields.$[field].value`]: formattedValue } },
      { arrayFilters: [{ "field.id": fieldId }] }
    );
    console.log(`Direct updateOne by groupId result:`, updateResult);

    // 3. Also update the in-memory model and save (fallback approach)
    const groupIndex = order.customFieldValues.findIndex(
      (g: any) => g.groupId === group.groupId
    );
    const fieldIndex = order.customFieldValues[groupIndex].fields.findIndex(
      (f: any) => f.id === fieldId
    );

    order.customFieldValues[groupIndex].fields[fieldIndex].value = formattedValue;
    const saveResult = await order.save();
    console.log(`Save result success:`, !!saveResult);

    // Verify the update took effect
    const updatedOrder = await Order.findById(orderId);
    if (updatedOrder) {
      const updatedGroup = updatedOrder.customFieldValues.find((g: any) => g.groupId === group.groupId);
      const updatedField = updatedGroup?.fields.find((f: any) => f.id === fieldId);
      console.log(`After save - field value: ${updatedField?.value}`);
    }

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
      queueNumber: group.queueNumber || '',
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
