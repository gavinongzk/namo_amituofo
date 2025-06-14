import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { orderId, eventId, groupId, attended } = await req.json();

    console.log(`Marking attendance for order ${orderId}, group ${groupId}: ${attended}`);

    // First, check if the registration is cancelled
    const existingOrder = await Order.findOne({
      _id: orderId,
      "customFieldValues.groupId": groupId
    });

    if (!existingOrder) {
      console.error(`Order not found: orderId=${orderId}, groupId=${groupId}`);
      return NextResponse.json({ message: 'Order or group not found' }, { status: 404 });
    }

    const existingGroup = existingOrder.customFieldValues.find(
      (group: { groupId: string; cancelled: boolean }) => group.groupId === groupId
    );

    if (!existingGroup) {
      console.error(`Group not found: groupId=${groupId} in order ${orderId}`);
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Prevent marking attendance for cancelled registrations
    if (existingGroup.cancelled && attended) {
      console.error(`Cannot mark attendance for cancelled registration: groupId=${groupId}`);
      return NextResponse.json({ 
        message: 'Cannot mark attendance for cancelled registration. Please uncancel the registration first.',
        error: 'CANCELLED_REGISTRATION'
      }, { status: 400 });
    }

    // Use atomic findOneAndUpdate to prevent race conditions
    const updatedOrder = await Order.findOneAndUpdate(
      { 
        _id: orderId, 
        "customFieldValues.groupId": groupId 
      },
      { 
        $set: { 
          "customFieldValues.$.attendance": attended,
          "customFieldValues.$.lastUpdated": new Date()
        } 
      },
      { 
        new: true, // Return the updated document
        runValidators: true
      }
    );

    if (!updatedOrder) {
      console.error(`Failed to update order: orderId=${orderId}, groupId=${groupId}`);
      return NextResponse.json({ message: 'Failed to update attendance' }, { status: 500 });
    }

    // Find the updated group to return in response
    const updatedGroup = updatedOrder.customFieldValues.find(
      (group: { groupId: string }) => group.groupId === groupId
    );

    // Invalidate relevant cache tags
    revalidateTag('order-details');
    revalidateTag('orders');
    revalidateTag(`order-${orderId}`);
    revalidateTag(`event-${eventId}`);
    revalidateTag('registrations');

    return NextResponse.json({ 
      message: 'Attendance updated successfully',
      order: {
        customFieldValues: updatedOrder.customFieldValues,
      },
      updatedGroup: updatedGroup
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { message: 'Error updating attendance', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}