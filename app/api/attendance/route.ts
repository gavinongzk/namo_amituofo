import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import Order from '@/lib/database/models/order.model'

async function handler(req: NextRequest) {
  try {
    await connectToDatabase()
    const { userId, eventId, attended, version } = await req.json();

    const order = await Order.findOne({ buyer: userId, event: eventId })
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    if (order.version !== version) {
      return NextResponse.json({ message: 'Version conflict' }, { status: 409 });
    }

    order.attendance = attended;
    order.version += 1;

    await order.save();

    return NextResponse.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating attendance', error }, { status: 500 })
  }
}
