import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/actions/event.actions';
import { IEvent } from '@/lib/database/models/event.model';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';

    const events = await getAllEvents({
      query: '',
      category: '',
      page: 1,
      limit: 1000,
      country: country
    });

    const eventsWithAllFields = {
      ...events,
      data: events.data?.map((event: IEvent) => ({
        ...event,
        location: event.location || '',  // Explicitly include location
      }))
    };
    
    return NextResponse.json(eventsWithAllFields);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Failed to fetch events' }, 
      { status: 500 }
    );
  }
}
