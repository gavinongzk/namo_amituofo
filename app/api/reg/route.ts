import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { getOrdersByPhoneNumber, getAllOrdersByPhoneNumberIncludingCancelled } from '@/lib/actions/order.actions';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const phoneNumber = req.nextUrl.searchParams.get('phoneNumber');
    const includeAllRegistrations = req.nextUrl.searchParams.get('includeAllRegistrations') === 'true';

    if (!phoneNumber) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    // If viewing details page, include cancelled registrations
    if (includeAllRegistrations) {
      const formattedOrders = await getAllOrdersByPhoneNumberIncludingCancelled(phoneNumber);
      return NextResponse.json(formattedOrders);
    } else {
      // For normal lookup, filter out cancelled registrations
      const formattedOrders = await getOrdersByPhoneNumber(phoneNumber);
      return NextResponse.json(formattedOrders);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
