import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const eventId = params.id;

    const attendees = await Order.find({ event: eventId, attendance: true })
      .populate('buyer', 'firstName lastName phoneNumber')
      .select('buyer customFieldValues');

    return NextResponse.json(attendees);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching attendees', error }, { status: 500 });
  }
}
