import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { getAllOrdersByPhoneNumber } from '@/lib/actions/order.actions';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const phoneNumber = req.nextUrl.searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    const formattedOrders = await getAllOrdersByPhoneNumber(phoneNumber);
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json(formattedOrders);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 