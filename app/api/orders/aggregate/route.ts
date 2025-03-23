import { NextRequest, NextResponse } from 'next/server';
import { aggregateOrdersByPhoneNumber } from '@/lib/actions/order.actions';

export async function GET(req: NextRequest) {
  try {
    const phoneNumber = req.nextUrl.searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const aggregatedOrders = await aggregateOrdersByPhoneNumber(phoneNumber);
    
    // Set cache control headers
    const response = NextResponse.json(aggregatedOrders);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=59');
    
    return response;
  } catch (error) {
    console.error('Error in aggregate orders route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 