import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import { getOrdersByEvent } from '@/lib/actions/order.actions'
import { formatDateTime } from '@/lib/utils';

// Add these interfaces at the top
interface Field {
  label: string;
  value: string;
  type?: string;
}

interface Group {
  fields: Field[];
  groupId: string;
  queueNumber?: string;
  attendance?: boolean;
  cancelled?: boolean;
}

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
      order.customFieldValues.map((group: Group) => {
        const nameField = group.fields.find((f: Field) => f.label.toLowerCase().includes('name'));
        const phoneField = group.fields.find((f: Field) => 
          f.label.toLowerCase().includes('phone number') || 
          f.label.toLowerCase().includes('contact number') || 
          f.type === 'phone'
        );

        const row = [
          group.queueNumber || 'N/A',
          order.event.title,
          formatDateTime(order.createdAt).dateTime,
          nameField?.value || 'N/A',
          phoneField?.value || 'N/A',
          group.attendance ? 'Yes' : 'No',
          group.cancelled ? 'Yes' : 'No'
        ];

        // Add all custom fields
        group.fields.forEach((field: Field) => {
          if (!headers.includes(field.label) && 
              field !== nameField && 
              field !== phoneField) {
            headers.push(field.label);
          }
          const index = headers.indexOf(field.label);
          if (index > -1) {
            row[index] = field.type === 'radio' ? (field.value === 'yes' ? '是 Yes' : '否 No') : field.value || 'N/A';
          }
        });

        return row;
      })
    );

    // Add BOM for UTF-8
    const BOM = '\uFEFF';
    const csvString = BOM + stringify([headers, ...data]);

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
