import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('X-User-Id');
    
    if (userId) {
      await connectToDatabase();
      const user = await User.findById(userId);
      if (user && user.customLocation) {
        return NextResponse.json({ country: user.customLocation });
      }
    }

    const response = await fetch('https://get.geojs.io/v1/ip/country.json');
    const data = await response.json();
    return NextResponse.json({ country: data.name });
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    return NextResponse.json({ error: 'Failed to get geolocation' }, { status: 500 });
  }
}
