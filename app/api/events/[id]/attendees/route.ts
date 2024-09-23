import '@/lib/database/models'
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import User from '@/lib/database/models/user.model'; // Import the User model
import Event from '@/lib/database/models/event.model'; // Import the User model

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const eventId = params.id;

    console.log('Fetching attendees for event:', eventId);

    const rawOrders = await Order.find({ event: eventId });
    console.log('Raw orders:', JSON.stringify(rawOrders, null, 2));

    const attendees = await Order.find({ event: eventId })
      .populate('buyer', 'phoneNumber')
      .populate('event', 'title startDateTime endDateTime')
      .select('buyer event customFieldValues queueNumber attendance version');

    console.log('Raw attendees:', JSON.stringify(attendees, null, 2));

    const formattedAttendees = attendees.map(order => ({
      id: order.buyer._id,
      phoneNumber: order.buyer.phoneNumber,
      eventTitle: order.event.title,
      eventStartDateTime: order.event.startDateTime,
      eventEndDateTime: order.event.endDateTime,
      order: {
        queueNumber: order.queueNumber,
        attended: order.attendance,
        customFieldValues: order.customFieldValues,
        version: order.version
      }
    }));

    console.log('Formatted attendees:', JSON.stringify(formattedAttendees, null, 2));

    return NextResponse.json({ attendees: formattedAttendees });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching attendees', error }, { status: 500 });
  }
}
