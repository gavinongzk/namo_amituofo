import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { getOrdersByEvent } from '@/lib/actions/order.actions';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const eventId = params.id;

    console.log('Fetching attendees for event:', eventId);

    const orders = await getOrdersByEvent({ eventId });

    if (!orders) {
      return NextResponse.json({ message: 'No orders found' }, { status: 404 });
    }

    const attendees = orders.flatMap(order => 
      order.customFieldValues.map(group => ({
        id: `${order._id}_${group.groupId}`,
        eventTitle: order.event.title,
        eventStartDateTime: order.event.startDateTime,
        eventEndDateTime: order.event.endDateTime,
        order: {
          customFieldValues: [
            {
              ...group,
              fields: group.fields.map(field => ({
                ...field,
                value: field.value
                  ? field.type === 'phone'
                    ? field.value
                    : typeof field.value === 'string'
                      ? field.value.replace(/\d/g, '*')
                      : String(field.value).replace(/\d/g, '*')
                  : '',
              })),
              __v: group.__v || 0 // Include version at the group level
            }
          ]
        }
      }))
    );

    // Log the entire attendees object
    console.log('Full attendees object:', JSON.stringify(attendees, null, 2));

    // Log just the __v values for each attendee
    console.log('__v values for each attendee:');
    attendees.forEach((attendee, index) => {
      console.log(`Attendee ${index + 1}: __v =`, attendee.order.customFieldValues[0].__v);
    });

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json({ message: 'Error fetching attendees', error }, { status: 500 });
  }
}
