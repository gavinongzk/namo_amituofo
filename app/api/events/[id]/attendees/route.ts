import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { withAuth } from '@/middleware/auth';

async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const eventId = params.id;

    console.log('Fetching attendees for event:', eventId);

    const attendees = await Order.find({ event: eventId })
      .populate('buyer', '_id')
      .select('buyer customFieldValues queueNumber attendance');

    console.log('Attendees found:', attendees.length);

    const formattedAttendees = attendees.map(order => ({
      id: order.buyer._id,
      name: order.customFieldValues[0]?.value || 'N/A',
      queueNumber: order.queueNumber,
      attended: order.attendance
    }));

    return NextResponse.json({ attendees: formattedAttendees });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json({ message: 'Error fetching attendees', error: (error as Error).message }, { status: 500 });
  }
}

export const GET = (req: NextRequest, params: { params: { id: string } }) => 
  withAuth(req, ['superadmin', 'admin'], (req) => handler(req, params));
