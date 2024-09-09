import { NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/actions/event.actions'; // Adjust the import based on your project structure

export async function GET() {
  try {
    const events = await getAllEvents({
      query: '', // No search query
      category: '', // No category filter
      page: 1, // Starting from the first page
      limit: 6 // Set your desired limit
    });
    console.log('Fetched Events:', events); // Add this line
    
    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}
