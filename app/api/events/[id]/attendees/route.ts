import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { getOrdersByEvent } from '@/lib/actions/order.actions';
import { unstable_cache } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

const getCachedAttendees = unstable_cache(
  async (eventId: string) => {
    await connectToDatabase();
    
    // Optimize query with lean() and field selection
    const orders = await getOrdersByEvent({ 
      eventId,
      select: 'customFieldValues event._id event.title event.startDateTime event.endDateTime'
    });

    if (!orders?.length) {
      return { attendees: [] };
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

    return { attendees };
  },
  ['event-attendees'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['attendees']
  }
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getCachedAttendees(params.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
