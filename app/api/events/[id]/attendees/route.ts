import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/index';
import { getOrdersByEvent } from '@/lib/actions/order.actions';
import { CustomFieldGroup, CustomField } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    await connectToDatabase();
    // Optimize query with lean() and field selection
    const orders = await getOrdersByEvent({ 
      eventId,
      select: 'customFieldValues event._id event.title event.startDateTime event.endDateTime'
    });

    if (!orders?.length) {
      return NextResponse.json({ attendees: [] });
    }

    // Process data in batches for better memory usage
    const BATCH_SIZE = 100;
    const attendees = [];
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);
      const batchAttendees = batch.flatMap(order => 
        order.customFieldValues.map((group: CustomFieldGroup) => ({
          id: `${order._id}_${group.groupId}`,
          eventTitle: order.event.title,
          eventStartDateTime: order.event.startDateTime,
          eventEndDateTime: order.event.endDateTime,
          order: {
            customFieldValues: [{
              ...group,
              fields: group.fields.map((field: CustomField) => ({
                ...field,
                value: field.value || '',
              })),
            }]
          }
        }))
      );
      attendees.push(...batchAttendees);
    }

    return NextResponse.json({ attendees });
  } catch (error) {
    return NextResponse.json({ attendees: [] }, { status: 500 });
  }
}
