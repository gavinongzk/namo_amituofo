import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const phoneNumber = req.nextUrl.searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    const orders = await Order.find({
      'customFieldValues': {
        $elemMatch: {
          'fields': {
            $elemMatch: {
              'type': 'phone',
              'value': phoneNumber
            }
          }
        }
      }
    })
    .populate('event', 'title imageUrl startDateTime endDateTime')
    .sort({ createdAt: -1 })
    .exec();

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      eventTitle: order.event.title,
      eventImageUrl: order.event.imageUrl,
      eventStartDateTime: order.event.startDateTime,
      eventEndDateTime: order.event.endDateTime,
      createdAt: order.createdAt,
      customFieldValues: order.customFieldValues
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
