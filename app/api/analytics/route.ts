import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import EventModel from '@/lib/database/models/event.model';
import mongoose from 'mongoose';

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
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');

    // Ensure Event model is registered
    const Event = mongoose.models.Event || EventModel;

    console.log('Fetching orders...');
    const orders = await Order.find().populate('event');
    console.log(`Found ${orders.length} orders`);
    
    const attendeeMap = new Map<string, AttendeeData>();

    console.log('Processing orders...');
    orders.forEach(order => {
      order.customFieldValues.forEach((group) => {
        const name = group.fields.find((field) => field.label.toLowerCase().includes('name'))?.value || 'Unknown';
        const phoneNumber = group.fields.find((field) => field.label.toLowerCase().includes('phone'))?.value || 'Unknown';
        const eventDate = order.event.startDateTime ? order.event.startDateTime.toISOString() : '';
        const eventTitle = order.event.title || '';

        const key = `${name}-${phoneNumber}`;
        if (!attendeeMap.has(key)) {
          attendeeMap.set(key, { name, phoneNumber, eventCount: 0, events: [] });
        }
        const attendee = attendeeMap.get(key)!;
        attendee.eventCount++;
        attendee.events.push({ eventDate, eventTitle });
      });
    });

    console.log(`Processed ${attendeeMap.size} unique attendees`);

    const attendees: Attendee[] = Array.from(attendeeMap.values()).map(attendee => {
      const lastEvent = attendee.events[attendee.events.length - 1];
      return {
        ...attendee,
        lastEventDate: lastEvent ? lastEvent.eventDate : '',
        eventDate: lastEvent ? lastEvent.eventDate : '',
        eventTitle: lastEvent ? lastEvent.eventTitle : '',
      };
    });

    console.log('Sending response with attendees data');
    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Error in GET /api/analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
