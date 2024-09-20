import '@/lib/database/models'
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import User from '@/lib/database/models/user.model'; // Import the User model
import Event from '@/lib/database/models/event.model'; // Import the User model

import { NextRequest, NextResponse } from 'next/server';

async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const eventId = params.id;

    console.log('Fetching attendees for event:', eventId);

    // Log the raw result of Order.find
    const rawOrders = await Order.find({ event: eventId });
    console.log('Raw orders:', JSON.stringify(rawOrders, null, 2));

    const attendees = await Order.find({ event: eventId })
      .populate('buyer', 'firstName lastName phoneNumber') // Populate with User fields
      .populate('event', 'title startDateTime endDateTime') // Populate with Event fields
      .select('buyer event customFieldValues queueNumber attendance version'); // Add version here

    console.log('Raw attendees:', JSON.stringify(attendees, null, 2));

    const formattedAttendees = attendees.map(order => {
      console.log('Processing order:', JSON.stringify(order, null, 2));
      return {
        id: order.buyer._id,
        phoneNumber: order.buyer.phoneNumber,
        eventTitle: order.event.title,
        eventStartDateTime: order.event.startDateTime,
        eventEndDateTime: order.event.endDateTime,
        order: {
          queueNumber: order.queueNumber,
          attended: order.attendance,
          customFieldValues: order.customFieldValues,
          version: order.version // Add version here
        }
      };
    });

    console.log('Formatted attendees:', JSON.stringify(formattedAttendees, null, 2));

    return NextResponse.json({ attendees: formattedAttendees });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json({ message: 'Error fetching attendees', error: (error as Error).message }, { status: 500 });
  }
}
