import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { phoneNumbers, eventId } = await req.json();
    
    const orders = await Order.find({
      event: eventId,
      'customFieldValues.fields': {
        $elemMatch: {
          type: 'phone',
          value: { $in: phoneNumbers }
        }
      }
    });

    const duplicates = phoneNumbers.filter(phone => 
      orders.some(order => 
        order.customFieldValues.some(group => 
          group.fields.some(field => 
            field.type === 'phone' && field.value === phone
          )
        )
      )
    );

    return NextResponse.json({ duplicates });
  } catch (error) {
    console.error('Error checking phone numbers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
