import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils';
import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  try {
    const { orderId, groupId, queueNumber, field: fieldId, value, isFromOrderDetails = false } = await req.json();

    await connectToDatabase();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Find the group using both groupId and queueNumber if available
    let group;
    
    if (queueNumber) {
      // Try to find by queueNumber first, which is more reliable
      group = order.customFieldValues.find(
        (g: any) => g.queueNumber === queueNumber
      );
    }
    
    // If we couldn't find by queueNumber or it wasn't provided, use groupId as fallback
    if (!group) {
      group = order.customFieldValues.find(
        (g: any) => g.groupId === groupId
      );
    }
    
    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    const fieldData = group.fields.find((f: any) => f.id === fieldId);
    
    if (!fieldData) {
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
        return NextResponse.json(
          { message: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    // Update the field value - using the actual group we found
    const groupIndex = order.customFieldValues.findIndex(
      (g: any) => g.groupId === group.groupId
    );
    const fieldIndex = order.customFieldValues[groupIndex].fields.findIndex(
      (f: any) => f.id === fieldId
    );

    order.customFieldValues[groupIndex].fields[fieldIndex].value = formattedValue;
    await order.save();

    // Invalidate relevant cache tags to prevent stale data
    revalidateTag('order-details');
    revalidateTag('orders');
    revalidateTag(`order-${orderId}`);
    
    // Include groupId and queueNumber in the response for confirmation
    return NextResponse.json({ 
      success: true,
      groupId: group.groupId,
      queueNumber: group.queueNumber
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { message: 'Error updating registration' },
      { status: 500 }
    );
  }
}
