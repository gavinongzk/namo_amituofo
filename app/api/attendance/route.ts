import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import Order from '@/lib/database/models/order.model'
import { Document } from 'mongoose';

// Define the type for customFieldValues
interface CustomFieldValue {
  groupId: string;
  attendance: boolean;
}

// Extend the Order model to include customFieldValues
interface OrderDocument extends Document {
  customFieldValues: CustomFieldValue[];
  version: number;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { userId, eventId, groupId, attended, version } = await req.json();

    const order: OrderDocument | null = await Order.findOne({ buyer: userId, event: eventId });
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.version !== version) {
      return NextResponse.json({ message: "Version conflict" }, { status: 409 });
    }

    const group = order.customFieldValues.find((group: CustomFieldValue) => group.groupId === groupId);
    if (group) {
      group.attendance = attended;
    }

    order.version += 1;

    await order.save();

    return NextResponse.json({ message: "Attendance updated successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Error updating attendance", error }, { status: 500 });
  }
}
