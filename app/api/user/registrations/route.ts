import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import User from '@/lib/database/models/user.model';
import { currentUser } from '@clerk/nextjs';

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await currentUser();
    const userId = user?.publicMetadata.userId as string;

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all orders for the authenticated user
    const orders = await Order.find({ buyer: userId })
      .populate('event', 'title')
      .exec();

    // Aggregate orders by event
    const registrationsMap: { [eventId: string]: any } = {};

    orders.forEach(order => {
      const eventId = order.event._id.toString();
      if (!registrationsMap[eventId]) {
        registrationsMap[eventId] = {
          eventId,
          eventTitle: order.event.title,
          registrations: []
        };
      }
      const nameField = order.customFieldValues.find((field: { label: string, value: string }) => field.label.toLowerCase().includes('name'));
      const name = nameField ? nameField.value : 'Unknown';
      registrationsMap[eventId].registrations.push({
        queueNumber: order.queueNumber,
        name
      });
    });

    // Convert the map to an array
    const aggregatedRegistrations = Object.values(registrationsMap);

    return NextResponse.json(aggregatedRegistrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
