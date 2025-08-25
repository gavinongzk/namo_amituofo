import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { getOrderDetailsWithoutExpirationCheck } from '@/lib/actions/order.actions';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connection successful');
    
    const { id } = params;
    console.log('Looking for order with ID:', id);
    
    if (!id) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    // Find the order by ID using the new function
    console.log('Querying database for order...');
    const order = await getOrderDetailsWithoutExpirationCheck(id);
    
    console.log('Query result:', order ? 'Order found' : 'Order not found');
    
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json(order);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 