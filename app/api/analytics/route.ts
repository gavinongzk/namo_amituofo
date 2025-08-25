import { NextRequest, NextResponse } from 'next/server';

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

// Helper function to get Singapore postal info
function getSingaporePostalInfo(postalCode: string): { region: string; town: string } {
  const code = parseInt(postalCode);
  
  // Singapore postal code regions
  if (code >= 1 && code <= 16) return { region: 'Central', town: 'Central' };
  if (code >= 17 && code <= 23) return { region: 'North', town: 'North' };
  if (code >= 24 && code <= 34) return { region: 'North-East', town: 'North-East' };
  if (code >= 35 && code <= 45) return { region: 'East', town: 'East' };
  if (code >= 46 && code <= 56) return { region: 'South-East', town: 'South-East' };
  if (code >= 57 && code <= 67) return { region: 'South', town: 'South' };
  if (code >= 68 && code <= 78) return { region: 'South-West', town: 'South-West' };
  if (code >= 79 && code <= 89) return { region: 'West', town: 'West' };
  if (code >= 90 && code <= 99) return { region: 'North-West', town: 'North-West' };
  
  return { region: 'Unknown', town: 'Unknown' };
}

export async function GET(req: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production' && !process.env.MONGODB_URI) {
      console.log('Skipping analytics during build time');
      return NextResponse.json([], {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
        },
      });
    }

    // Use dynamic imports to avoid build-time issues
    let connectToDatabase: any;
    let Order: any;
    
    try {
      // Import modules dynamically at runtime
      const dbModule = await import('@/lib/database');
      connectToDatabase = dbModule.connectToDatabase;
      
      const orderModule = await import('@/lib/database/models/order.model');
      Order = orderModule.default;
    } catch (importError) {
      console.error('Failed to import database modules:', importError);
      return NextResponse.json([], {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
        },
      });
    }

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
      order.customFieldValues.forEach((group: any) => {
        const name = group.fields.find((field: any) => field.label.toLowerCase().includes('name'))?.value?.toString() || 'Unknown';
        const phoneNumber = group.fields.find((field: any) => 
          field.label.toLowerCase().includes('phone') || field.type === 'phone'
        )?.value?.toString() || 'Unknown';
        const postalCode = group.fields.find((field: any) => 
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
