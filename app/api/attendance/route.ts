import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { orderId, eventId, groupId, attended } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const groupIndex = order.customFieldValues.findIndex((group: { groupId: string }) => group.groupId === groupId);
    if (groupIndex === -1) {
      console.error(`Group not found: ${groupId} in order ${orderId}`);
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    order.customFieldValues[groupIndex].attendance = attended;

    await order.save();

    return NextResponse.json({ 
      message: 'Attendance updated successfully',
      order: {
        customFieldValues: order.customFieldValues,
      }
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ message: 'Error updating attendance', error: error.message }, { status: 500 });
  }
}