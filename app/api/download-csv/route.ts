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

    const headers = ['Queue Number', 'Event Title', 'Registration Date'];

    if (orders && orders.length > 0 && orders[0]?.customFieldValues?.[0]?.fields) {
      headers.push(
        ...orders[0].customFieldValues[0].fields
          .filter(field => !['name'].includes(field.label.toLowerCase()))
          .map(field => field.label)
      );
    }

    if (!orders || orders.length === 0) {
      return new NextResponse('No orders found', { status: 404 });
    }

    const data = orders.flatMap(order => 
      order.customFieldValues.map(group => [
        group.queueNumber || 'N/A',
        order.event.title,
        formatDateTime(order.createdAt).dateTime,
        ...group.fields
          .filter(field => !['name'].includes(field.label.toLowerCase()))
          .map(field => field.type === 'radio' ? (field.value === 'yes' ? '是 Yes' : '否 No') : (field.value || 'N/A'))
      ])
    );

    const csvString = stringify([headers, ...data]);

    const eventTitle = orders[0]?.event.title || 'Untitled';
    
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${eventTitle}_orders.csv`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return new NextResponse('Error generating CSV', { status: 500 });
  }
}
