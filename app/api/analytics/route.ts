import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const orders = await Order.find().populate('event');
    
    const attendeeMap = new Map();

    orders.forEach(order => {
      order.customFieldValues.forEach((value: { fields: Array<{ label: string; value: string }> }) => {
        const name = value.fields.find((field) => field.label.toLowerCase().includes('name'))?.value || 'Unknown';
        const phoneNumber = value.fields.find((field) => field.label.toLowerCase().includes('phone'))?.value || 'Unknown';
        const eventDate = order.event.startDateTime;
        const eventTitle = order.event.title;

        const key = `${name}-${phoneNumber}`;
        if (!attendeeMap.has(key)) {
          attendeeMap.set(key, { name, phoneNumber, eventCount: 0, events: [] });
        }
        attendeeMap.get(key).eventCount++;
        attendeeMap.get(key).events.push({ eventDate, eventTitle });
      });
    });

    const attendees = Array.from(attendeeMap.values()).map(attendee => ({
      ...attendee,
      lastEventDate: attendee.events[attendee.events.length - 1].eventDate,
      eventDate: attendee.events[attendee.events.length - 1].eventDate,
      eventTitle: attendee.events[attendee.events.length - 1].eventTitle,
    }));

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
