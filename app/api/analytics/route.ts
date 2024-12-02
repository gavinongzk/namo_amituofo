import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order, { IOrder } from '@/lib/database/models/order.model';
import Event, { IEvent } from '@/lib/database/models/event.model';
import { CustomFieldGroup, CustomField } from '@/types';
import { getSingaporePostalInfo } from '@/lib/utils';
import mongoose from 'mongoose';

interface AttendeeEvent {
  eventDate: string;
  eventTitle: string;
  category: {
    name: string;
  };
}

interface AttendeeData {
  name: string;
  phoneNumber: string;
  postalCode: string;
  region: string;
  town: string;
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

    console.log('Fetching orders...');
    const orders = await Order.find().populate({
      path: 'event',
      populate: {
        path: 'category'
      }
    });
    console.log(`Found ${orders.length} orders`);
    console.log('Sample order:', JSON.stringify(orders[0], null, 2));

    const attendeeMap = new Map<string, AttendeeData>();

    console.log('Processing orders...');
    orders.forEach((order: any) => {
      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        const name = group.fields.find((field: CustomField) => field.label.toLowerCase().includes('name'))?.value?.toString() || 'Unknown';
        const phoneNumber = group.fields.find((field: CustomField) => 
          field.label.toLowerCase().includes('phone') || field.type === 'phone'
        )?.value?.toString() || 'Unknown';
        const postalCode = group.fields.find((field: CustomField) => 
          field.label.toLowerCase().includes('postal')
        )?.value?.toString() || '';
        const { region, town } = getSingaporePostalInfo(postalCode);

        const eventDate = order.event ? order.event.startDateTime?.toISOString() : '';
        const eventTitle = order.event ? order.event.title : '';
        const categoryName = order.event?.category?.name || 'Uncategorized';

        const key = `${name}-${phoneNumber}`;
        if (!attendeeMap.has(key)) {
          attendeeMap.set(key, { 
            name, 
            phoneNumber, 
            postalCode,
            region,
            town,
            eventCount: 0, 
            events: [] 
          });
        }
        const attendee = attendeeMap.get(key)!;
        attendee.eventCount++;
        attendee.events.push({ 
          eventDate, 
          eventTitle,
          category: { name: categoryName }
        });
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
