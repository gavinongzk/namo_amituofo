import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { CustomFieldGroup } from '@/types';

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

export async function GET() {
  try {
    await connectToDatabase();

    // Get all orders with populated event data, excluding cancelled registrations
    const orders = await Order.find({
      'customFieldValues.cancelled': { $ne: true }
    })
      .populate({
        path: 'event',
        select: '_id title startDateTime endDateTime category',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .lean();

    if (!orders || orders.length === 0) {
      return new NextResponse(JSON.stringify([]), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
        },
      });
    }

    // Process orders to create attendee analytics
    const attendeeMap = new Map<string, Attendee>();

    orders.forEach(order => {
      if (!order.event) return;

      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        // Skip cancelled registrations
        if (group.cancelled) return;

        // Extract attendee information from custom fields
        const nameField = group.fields.find(field => 
          field.label.toLowerCase().includes('name') && field.value
        );
        const phoneField = group.fields.find(field => 
          field.type === 'phone' && field.value
        );
        const postalCodeField = group.fields.find(field => 
          field.label.toLowerCase().includes('postal') && field.value
        );
        
        // Try different variations for region field
        const regionField = group.fields.find(field => 
          (field.label.toLowerCase().includes('region') || 
           field.label.toLowerCase().includes('area') ||
           field.label.toLowerCase().includes('state') ||
           field.label.toLowerCase().includes('district')) && field.value
        );
        const townField = group.fields.find(field => 
          (field.label.toLowerCase().includes('town') || 
           field.label.toLowerCase().includes('city') ||
           field.label.toLowerCase().includes('location')) && field.value
        );

        const phoneNumber = (phoneField?.value as string) || 'Unknown';
        const name = (nameField?.value as string) || 'Unknown';
        const postalCode = (postalCodeField?.value as string) || '';
        
        // Try to derive region from postal code if no explicit region field
        let region = (regionField?.value as string) || 'Unknown';
        if (region === 'Unknown' && postalCode && postalCode.length >= 2) {
          const postalPrefix = postalCode.substring(0, 2);
          const prefixNum = parseInt(postalPrefix, 10);
          
          // Singapore postal code mapping (first 2 digits)
          if (prefixNum >= 1 && prefixNum <= 8) region = 'Central';
          else if (prefixNum >= 9 && prefixNum <= 16) region = 'East';
          else if (prefixNum >= 17 && prefixNum <= 24) region = 'North';
          else if (prefixNum >= 25 && prefixNum <= 32) region = 'Northeast';
          else if (prefixNum >= 33 && prefixNum <= 40) region = 'West';
          else if (prefixNum >= 41 && prefixNum <= 48) region = 'South';
          else if (prefixNum >= 49 && prefixNum <= 56) region = 'Southwest';
          else if (prefixNum >= 57 && prefixNum <= 64) region = 'Northwest';
          else if (prefixNum >= 65 && prefixNum <= 72) region = 'Southeast';
          else if (prefixNum >= 73 && prefixNum <= 80) region = 'Central';
          else if (prefixNum >= 81 && prefixNum <= 88) region = 'Central';
          // Malaysia postal code mapping (first 2 digits)
          else if (prefixNum >= 10 && prefixNum <= 19) region = 'Kuala Lumpur';
          else if (prefixNum >= 20 && prefixNum <= 29) region = 'Selangor';
          else if (prefixNum >= 30 && prefixNum <= 39) region = 'Negeri Sembilan';
          else if (prefixNum >= 40 && prefixNum <= 49) region = 'Melaka';
          else if (prefixNum >= 50 && prefixNum <= 59) region = 'Johor';
          else if (prefixNum >= 60 && prefixNum <= 69) region = 'Kedah';
          else if (prefixNum >= 70 && prefixNum <= 79) region = 'Penang';
          else if (prefixNum >= 80 && prefixNum <= 89) region = 'Perak';
          else if (prefixNum >= 90 && prefixNum <= 99) region = 'Kelantan';
          else region = 'Other';
        }
        
        const town = (townField?.value as string) || '';

        // Create or update attendee record
        if (!attendeeMap.has(phoneNumber)) {
          attendeeMap.set(phoneNumber, {
            name,
            phoneNumber,
            postalCode,
            region,
            town,
            eventCount: 0,
            events: [],
            lastEventDate: '',
            eventDate: '',
            eventTitle: ''
          });
        }

        const attendee = attendeeMap.get(phoneNumber)!;
        
        // Add event to attendee's events list
        const eventData: AttendeeEvent = {
          eventDate: order.event.startDateTime?.toISOString() || new Date().toISOString(),
          eventTitle: order.event.title,
          category: {
            name: order.event.category?.name || 'Uncategorized'
          }
        };

        attendee.events.push(eventData);
        attendee.eventCount = attendee.events.length;

        // Update last event date
        const eventDate = new Date(eventData.eventDate);
        if (!attendee.lastEventDate || eventDate > new Date(attendee.lastEventDate)) {
          attendee.lastEventDate = eventData.eventDate;
          attendee.eventDate = eventData.eventDate;
          attendee.eventTitle = eventData.eventTitle;
        }
      });
    });

    // Convert map to array and sort by event count (descending)
    const attendees = Array.from(attendeeMap.values())
      .sort((a, b) => b.eventCount - a.eventCount);

    return new NextResponse(JSON.stringify(attendees), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    return NextResponse.json(
      { message: 'Failed to fetch analytics', data: [] }, 
      { status: 500 }
    );
  }
}
