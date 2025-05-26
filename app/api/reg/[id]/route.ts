import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

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

    // Find the order by ID
    console.log('Querying database for order...');
    const order = await Order.findById(id)
      .populate('event')
      .populate('buyer')
      .select('-__v'); // Exclude version field to reduce payload size
    
    console.log('Query result:', order ? 'Order found' : 'Order not found');
    
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json(JSON.parse(JSON.stringify(order)));
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 