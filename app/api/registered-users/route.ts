import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

async function handler(req: NextRequest) {
  try {
    await connectToDatabase();
    const eventId = req.nextUrl.searchParams.get('eventId'); // Get eventId from query parameters

    // Fetch registered users for the specific event
    const orders = await Order.find({ event: eventId})
      .populate('buyer', 'queueNumber') // Adjust fields as necessary
      .select('buyer');

    const registeredUsers = orders.map(order => ({
      id: order.buyer._id,
      queueNumber: order.buyer.queueNumber,
    }));

    return NextResponse.json(registeredUsers);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching registered users', error }, { status: 500 });
  }
}

export const GET = handler;
