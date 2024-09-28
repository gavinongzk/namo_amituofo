import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { orderId, eventId, groupId, attended, version } = await req.json();

    let updated = false;
    let attempts = 0;
    const maxAttempts = 3;

    let order;
    while (!updated && attempts < maxAttempts) {
      order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }

      const groupIndex = order.customFieldValues.findIndex((group: { groupId: string }) => group.groupId === groupId);
      if (groupIndex === -1) {
        return NextResponse.json({ message: 'Group not found' }, { status: 404 });
      }

      if (order.customFieldValues[groupIndex].__v !== version) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100 * attempts)); // Exponential backoff
        continue;
      }

      order.customFieldValues[groupIndex].attendance = attended;
      order.customFieldValues[groupIndex].__v += 1;

      try {
        await order.save();
        updated = true;
      } catch (error) {
        if (error instanceof Error && error.name === 'VersionError') {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!updated) {
      return NextResponse.json({ message: 'Failed to update after multiple attempts' }, { status: 409 });
    }

    return NextResponse.json({ 
      message: 'Attendance updated successfully',
      order: {
        customFieldValues: order.customFieldValues,
      }
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ message: 'Error updating attendance' }, { status: 500 });
  }
}
