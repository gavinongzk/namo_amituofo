import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { withAuth } from '@/middleware/auth';

async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const eventId = params.id;

    const attendees = await Order.find({ event: eventId })
      .populate('buyer', 'firstName lastName')
      .select('buyer queueNumber attendance');

    const formattedAttendees = attendees.map(order => ({
      id: order.buyer._id,
      firstName: order.buyer.firstName,
      lastName: order.buyer.lastName,
      queueNumber: order.queueNumber,
      attended: order.attendance
    }));

    return NextResponse.json(formattedAttendees);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching attendees', error }, { status: 500 });
  }
}

export const GET = (req: NextRequest, params: { params: { id: string } }) => 
  withAuth(req, ['superadmin', 'admin'], (req) => handler(req, params));
