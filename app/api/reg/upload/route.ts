import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { CustomFieldGroup } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { eventId, ordersData } = await req.json(); // Destructure eventId and ordersData from the request body

    console.log('Received data:', { eventId, ordersData }); // Log the received data

    if (!eventId || !ordersData || ordersData.length === 0) {
      return NextResponse.json({ message: 'Event ID and orders data are required' }, { status: 400 });
    }

    const orders = ordersData.map((data: any) => {
      const customFieldValues: CustomFieldGroup[] = data.customFieldValues.map((group: any) => ({
        groupId: group.groupId,
        fields: group.fields.map((field: any) => ({
          id: field.id,
          label: field.label,
          type: field.type,
          value: field.value,
        })),
        queueNumber: group.queueNumber,
        attendance: group.attendance || false,
        cancelled: group.cancelled || false,
      }));

      return {
        createdAt: new Date(),
        event: eventId, // Use the received eventId for the order
        customFieldValues,
      };
    });

    await Order.insertMany(orders);

    return NextResponse.json({ message: 'Orders uploaded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error uploading orders:', error);
    return NextResponse.json({ message: 'Error uploading orders', error: (error as Error).message }, { status: 500 });
  }
}

// Add a GET endpoint to fetch all existing queue numbers for an event
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json({ queueNumbers: [] }, { status: 400 });
    }
    const orders = await Order.find({ event: eventId });
    const queueNumbers = orders
      .flatMap((order: any) => order.customFieldValues.map((g: any) => g.queueNumber))
      .filter((qn: string | undefined) => !!qn);
    return NextResponse.json({ queueNumbers });
  } catch (error) {
    return NextResponse.json({ queueNumbers: [], error: (error as Error).message }, { status: 500 });
  }
}
