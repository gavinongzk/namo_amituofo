import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import { getOrdersByEvent } from '@/lib/actions/order.actions'
import { formatDateTime } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get('eventId');
  const searchText = searchParams.get('searchText') || '';

  if (!eventId) {
    return new NextResponse('Event ID is required', { status: 400 });
  }

  try {
    const orders = await getOrdersByEvent({ eventId, searchString: searchText });

    if (!orders || orders.length === 0) {
      return new NextResponse('No orders found', { status: 404 });
    }

    const headers = [
      'Queue Number',
      'Event Title',
      'Registration Date',
      'Name',
      'Phone Number',
      'Attendance',
      'Cancelled'
    ];

    const data = orders.flatMap(order => 
      order.customFieldValues.map(group => {
        const row = [
          group.queueNumber || 'N/A',
          order.event.title,
          formatDateTime(order.createdAt).dateTime,
          group.fields.find(f => f.label.toLowerCase() === 'name')?.value || 'N/A',
          group.fields.find(f => f.label.toLowerCase() === 'phone number' || f.type === 'phone')?.value || 'N/A',
          group.attendance ? 'Yes' : 'No',
          group.cancelled ? 'Yes' : 'No'
        ];

        // Add all custom fields
        group.fields.forEach(field => {
          if (!headers.includes(field.label)) {
            headers.push(field.label);
          }
          const index = headers.indexOf(field.label);
          row[index] = field.type === 'radio' ? (field.value === 'yes' ? '是 Yes' : '否 No') : field.value || 'N/A';
        });

        return row;
      })
    );

    const csvString = stringify([headers, ...data]);

    const eventTitle = orders[0]?.event.title || 'Untitled';
    const encodedEventTitle = encodeURIComponent(eventTitle);

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=${encodedEventTitle}_data.csv`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return new NextResponse('Error generating CSV', { status: 500 });
  }
}
