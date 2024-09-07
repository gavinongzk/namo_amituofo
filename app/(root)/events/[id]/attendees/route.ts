import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { withAuth } from '@/middleware/auth';

async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const eventId = params.id;

    const attendees = await Order.find({ event: eventId, attendance: true })
      .populate('buyer', 'firstName lastName phoneNumber')
      .select('buyer customFieldValues');

    return NextResponse.json(attendees);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching attendees', error }, { status: 500 });
  }
}

export const GET = (req: NextRequest, params: { params: { id: string } }) => 
  withAuth(req, ['superadmin', 'admin'], (req) => handler(req, params));
