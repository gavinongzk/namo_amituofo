import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Event from '@/lib/database/models/event.model';
import Order from '@/lib/database/models/order.model';

export async function GET() {
  try {
    await connectToDatabase();

    // Get all events
    const events = await Event.find({}).limit(10);
    console.log('All events:', events.map(e => ({ id: e._id, title: e.title, isDeleted: e.isDeleted })));

    // Get all orders
    const orders = await Order.find({}).limit(10);
    console.log('All orders:', orders.map(o => ({ id: o._id, event: o.event, createdAt: o.createdAt })));

    // Look specifically for volunteer events
    const volunteerEvents = await Event.find({ 
      title: { $regex: /义工|volunteer/i }
    });
    console.log('Volunteer events:', volunteerEvents.map(e => ({ id: e._id, title: e.title, isDeleted: e.isDeleted })));

    return NextResponse.json({
      success: true,
      events: events.map(e => ({ id: e._id, title: e.title, isDeleted: e.isDeleted })),
      orders: orders.map(o => ({ id: o._id, event: o.event, createdAt: o.createdAt })),
      volunteerEvents: volunteerEvents.map(e => ({ id: e._id, title: e.title, isDeleted: e.isDeleted }))
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
