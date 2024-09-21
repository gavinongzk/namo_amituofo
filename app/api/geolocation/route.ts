import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://get.geojs.io/v1/ip/country.json');
    const data = await response.json();
    return NextResponse.json({ country: data.country });
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    return NextResponse.json({ error: 'Failed to get geolocation' }, { status: 500 });
  }
}
