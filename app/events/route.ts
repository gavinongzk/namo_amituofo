import { NextRequest, NextResponse } from 'next/server';
import { preloadEvents } from '@/lib/actions/preload';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const country = cookieStore.get('userCountry')?.value || 'Singapore';
    
    const events = await preloadEvents(country);
    
    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error in events route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
} 