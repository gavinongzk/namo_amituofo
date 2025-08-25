import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order, { IOrder } from '@/lib/database/models/order.model';
import Event, { IEvent } from '@/lib/database/models/event.model';
import { CustomFieldGroup, CustomField } from '@/types';
import { getSingaporePostalInfo } from '@/lib/utils';
import mongoose from 'mongoose';
import { unstable_cache } from 'next/cache';

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

// Cache the analytics data to prevent build timeouts
const getCachedAnalytics = unstable_cache(
  async () => {
    try {
      console.log('Connecting to database...');
      await connectToDatabase();
      console.log('Database connected successfully');

      console.log('Fetching orders...');
      // Optimize query with lean() and field selection
      const orders = await Order.find()
        .select('customFieldValues event createdAt')
        .populate({
          path: 'event',
          select: 'title startDateTime category',
          populate: {
            path: 'category',
            select: 'name'
          }
        })
        .lean()
        .sort({ createdAt: -1 })
        .limit(1000); // Limit to prevent memory issues
      
      console.log(`Found ${orders.length} orders`);

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
              postalCode: '',
              region: '',
              town: '',
              eventCount: 0, 
              events: [] 
            });
          }
          const attendee = attendeeMap.get(key)!;
          if (postalCode) {
            attendee.postalCode = postalCode;
            attendee.region = region;
            attendee.town = town;
          }
          attendee.eventCount++;
          attendee.events.push({ 
            eventDate, 
            eventTitle,
            category: { name: categoryName }
          });
          attendee.events.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
        });
      });

      console.log(`Processed ${attendeeMap.size} unique attendees`);

      const attendees: Attendee[] = Array.from(attendeeMap.values()).map(attendee => {
        const lastEvent = attendee.events[attendee.events.length - 1];
        return {
          ...attendee,
          lastEventDate: lastEvent ? lastEvent.eventDate : '',
          eventDate: lastEvent ? lastEvent.eventDate : '',
          eventTitle: lastEvent ? lastEvent.eventTitle : ''
        };
      });

      return attendees;
    } catch (error) {
      console.error('Error in getCachedAnalytics:', error);
      return [];
    }
  },
  ['analytics-data'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['analytics']
  }
);

export async function GET(req: NextRequest) {
  try {
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 second timeout
    });
    
    const analyticsPromise = getCachedAnalytics();
    const attendees = await Promise.race([analyticsPromise, timeoutPromise]) as Attendee[];

    return new NextResponse(JSON.stringify(attendees), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    // Return cached data if available, otherwise return error
    try {
      const fallbackData = await getCachedAnalytics();
      return new NextResponse(JSON.stringify(fallbackData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
          'X-Error': 'true',
        },
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { message: 'Failed to fetch analytics', data: [] }, 
        { status: 500 }
      );
    }
  }
}
