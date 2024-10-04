import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/actions/event.actions';
import { useUser } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { user, isLoaded } = useUser();
    let country = 'Singapore'; // Default to Singapore

    if (isLoaded) {
      if (user?.publicMetadata.country) {
        country = user.publicMetadata.country as string;
      }
    } else {
      // If no user is authenticated, try to get country from cookie
      const cookieCountry = request.cookies.get('userCountry')?.value;
      if (cookieCountry) {
        country = cookieCountry;
      }
    }

    const events = await getAllEvents({
      query: '',
      category: '',
      page: 1,
      limit: 1000,
      country: country
    });
    console.log('Fetched Events:', events);
    
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
