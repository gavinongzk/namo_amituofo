import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';

interface AttendeeEvent {
  eventDate: string;
  eventTitle: string;
}

interface AttendeeData {
  name: string;
  phoneNumber: string;
  eventCount: number;
  events: AttendeeEvent[];
}

interface Attendee extends AttendeeData {
  lastEventDate: string;
  eventDate: string;
  eventTitle: string;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const orders = await Order.find().populate('event');
    
    const attendeeMap = new Map<string, AttendeeData>();

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
        const attendee = attendeeMap.get(key)!;
        attendee.eventCount++;
        attendee.events.push({ eventDate, eventTitle });
      });
    });

    const attendees: Attendee[] = Array.from(attendeeMap.values()).map(attendee => {
      const lastEvent = attendee.events[attendee.events.length - 1];
      return {
        ...attendee,
        lastEventDate: lastEvent.eventDate,
        eventDate: lastEvent.eventDate,
        eventTitle: lastEvent.eventTitle,
      };
    });

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
