import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { orderId, groupId, field, value } = await req.json();

    // Add phone number validation
    if (field.label.toLowerCase().includes('phone') || field.label.toLowerCase().includes('contact')) {
      const formattedPhone = formatPhoneNumber(value);
      if (!isValidPhoneNumber(formattedPhone)) {
        return NextResponse.json(
          { message: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    let formattedValue = value;
    if (field.label.toLowerCase().includes('phone') || field.label.toLowerCase().includes('contact')) {
      formattedValue = formatPhoneNumber(value);
    }

    // Update the specific field in the correct group
    const groupIndex = order.customFieldValues.findIndex(
      (group: any) => group.groupId === groupId
    );

    if (groupIndex === -1) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    const fieldIndex = order.customFieldValues[groupIndex].fields.findIndex(
      (f: any) => f.id === field
    );

    if (fieldIndex === -1) {
      return NextResponse.json(
        { message: 'Field not found' },
        { status: 404 }
      );
    }

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
