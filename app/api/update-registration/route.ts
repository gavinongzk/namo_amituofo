import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { orderId, groupId, field: fieldId, value } = await req.json();

    await connectToDatabase();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Find the group and field to get the field label
    const group = order.customFieldValues.find(
      (group: any) => group.groupId === groupId
    );
    
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
    if (fieldData.label.toLowerCase().includes('phone') || 
        fieldData.label.toLowerCase().includes('contact')) {
      formattedValue = formatPhoneNumber(value);
      if (!isValidPhoneNumber(formattedValue)) {
        return NextResponse.json(
          { message: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    // Update the field value
    const groupIndex = order.customFieldValues.findIndex(
      (g: any) => g.groupId === groupId
    );
    const fieldIndex = order.customFieldValues[groupIndex].fields.findIndex(
      (f: any) => f.id === fieldId
    );

    order.customFieldValues[groupIndex].fields[fieldIndex].value = formattedValue;
    await order.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { message: 'Error updating registration' },
      { status: 500 }
    );
  }
}
