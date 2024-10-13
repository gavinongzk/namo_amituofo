import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import { getOrdersByEvent } from '@/lib/actions/order.actions'
import { formatDateTime } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get('eventId');
  const searchText = searchParams.get('searchText') || '';
  const headersParam = searchParams.get('headers');
  const fieldsParam = searchParams.get('fields');

  if (!eventId) {
    return new NextResponse('Event ID is required', { status: 400 });
  }

  if (!headersParam || !fieldsParam) {
    return new NextResponse('Headers and fields are required', { status: 400 });
  }

  try {
    const headers = JSON.parse(decodeURIComponent(headersParam));
    const fields = JSON.parse(decodeURIComponent(fieldsParam));

    const orders = await getOrdersByEvent({ eventId, searchString: searchText });

    // Fetch tagged users
    const response = await fetch('/api/tagged-users');
    const taggedUsersData = await response.json();
    const taggedUsersMap: Record<string, string> = taggedUsersData.reduce((acc: Record<string, string>, user: { phoneNumber: string; remarks: string }) => {
      acc[user.phoneNumber] = user.remarks;
      return acc;
    }, {});

    if (!orders || orders.length === 0) {
      return new NextResponse('No orders found', { status: 404 });
    }

    const data = orders.flatMap(order => 
      order.customFieldValues.map(group => {
        const phoneNumberField = group.fields.find(f => f.label.toLowerCase() === 'phone number');
        const phoneNumber = typeof phoneNumberField?.value === 'string' ? phoneNumberField.value : '';
        const remarks = phoneNumber && taggedUsersMap[phoneNumber] ? taggedUsersMap[phoneNumber] : '';
        return fields.map((field: string) => {
          switch (field) {
            case 'queueNumber':
              return group.queueNumber || 'N/A';
            case 'name':
              return group.fields.find(f => f.label.toLowerCase() === 'name')?.value || 'N/A';
            case 'phoneNumber':
              return phoneNumber || 'N/A';
            case 'remarks':
              return remarks;
            case 'attendance':
              return group.attendance ? 'Yes' : 'No';
            case 'cancelled':
              return group.cancelled ? 'Yes' : 'No';
            case 'registrationDate':
              return formatDateTime(order.createdAt).dateTime;
            default:
              return group.fields.find(f => f.label.toLowerCase() === field.toLowerCase())?.value || 'N/A';
          }
        });
      })
    );

    const csvString = stringify([headers, ...data]);

    const eventTitle = orders[0]?.event.title || 'Untitled';
    
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${eventTitle}_data.csv`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return new NextResponse('Error generating CSV', { status: 500 });
  }
}
