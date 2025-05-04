import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { getOrdersByPhoneNumber, getAllOrdersByPhoneNumberIncludingCancelled } from '@/lib/actions/order.actions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const orderId = searchParams.get('orderId');
    const groupId = searchParams.get('groupId');
    const includeAllRegistrations = searchParams.get('includeAllRegistrations') === 'true';

    await connectToDatabase();

    let query: any = {};

    if (phoneNumber) {
      // Search by phone number
      query['customFieldValues.fields'] = {
        $elemMatch: {
          type: 'phone',
          value: phoneNumber
        }
      };
    } else if (orderId && groupId) {
      // Search by order ID and group ID
      query = {
        _id: orderId,
        'customFieldValues.groupId': groupId
      };
    } else {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!includeAllRegistrations) {
      query['customFieldValues.cancelled'] = { $ne: true };
    }

    const orders = await Order.find(query)
      .populate('event')
      .populate('buyer')
      .lean();

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error in registration lookup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
