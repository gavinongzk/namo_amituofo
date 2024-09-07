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
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ message: 'Failed to fetch events' }, { status: 500 });
  }
}
