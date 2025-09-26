import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Event from '@/lib/database/models/event.model';
import Order from '@/lib/database/models/order.model';

export async function POST() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Find the volunteer event
    const volunteerEvent = await Event.findOne({ 
      title: '净土儿童佛学班·义工招募',
      isDeleted: false 
    });

    if (!volunteerEvent) {
      return NextResponse.json({ error: 'Volunteer event not found' }, { status: 404 });
    }

    console.log('Found volunteer event:', volunteerEvent._id);

    // Try to create a simple order
    const testOrder = await Order.create({
      event: volunteerEvent._id,
      buyer: null,
      customFieldValues: [{
        groupId: 'test-group',
        fields: [{
          id: '1',
          label: 'Test Field',
          type: 'text',
          value: 'Test Value'
        }],
        queueNumber: 'TEST001',
        cancelled: false,
        attendance: false,
        qrCode: '',
        lastUpdated: new Date(),
        __v: 0
      }],
      createdAt: new Date()
    });

    console.log('Created test order:', testOrder._id);

    return NextResponse.json({
      success: true,
      orderId: testOrder._id,
      eventId: volunteerEvent._id
    });

  } catch (error) {
    console.error('Error in test order creation:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
