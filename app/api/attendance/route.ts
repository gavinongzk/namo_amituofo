import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { orderId, eventId, groupId, attended, version } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.__v !== version) {
      return NextResponse.json({ message: 'Version conflict' }, { status: 409 });
    }

    const groupIndex = order.customFieldValues.findIndex((group: { groupId: string }) => group.groupId === groupId);
    if (groupIndex === -1) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    order.customFieldValues[groupIndex].attendance = attended;
    order.customFieldValues[groupIndex].__v += 1;

    await order.save();

    return NextResponse.json({ 
      message: 'Attendance updated successfully',
      order: {
        customFieldValues: order.customFieldValues,
        version: order.__v
      }
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ message: 'Error updating attendance' }, { status: 500 });
  }
}
