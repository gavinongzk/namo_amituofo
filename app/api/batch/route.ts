import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/index';
import { Order, Event } from '@/lib/database/models';
import { getOrderDetailsWithoutExpirationCheck } from '@/lib/actions/order.actions';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { requests } = await req.json();

    if (!Array.isArray(requests)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const results = await Promise.all(
      requests.map(async (request) => {
        try {
          switch (request.type) {
            case 'getOrder':
              const order = await getOrderDetailsWithoutExpirationCheck(request.orderId);
              return { id: request.id, type: 'getOrder', data: order };
            
            case 'getEvent':
              const event = await Event.findById(request.eventId).lean();
              return { id: request.id, type: 'getEvent', data: event };
            
            case 'getUserRegistrations':
              const orders = await Order.find({
                'customFieldValues.fields': {
                  $elemMatch: {
                    type: 'phone',
                    value: request.phoneNumber
                  }
                }
              }).populate('event').lean();
              return { id: request.id, type: 'getUserRegistrations', data: orders };
            
            default:
              return { id: request.id, error: 'Unknown request type' };
          }
        } catch (error) {
          return { id: request.id, error: (error as Error).message };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in batch API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 