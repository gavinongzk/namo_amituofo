import { NextRequest, NextResponse } from 'next/server';
import { createOrGetSpreadsheet, clearSheet, appendToSheet } from '@/lib/google-sheets';
import { getOrdersByEvent } from '@/lib/actions/order.actions';
import { formatDateTime } from '@/lib/utils';

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

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get('eventId');
  const searchText = searchParams.get('searchText') || '';

  if (!eventId) {
    return new NextResponse('Event ID is required', { status: 400 });
  }

  try {
    // Get orders data
    const orders = await getOrdersByEvent({ eventId, searchString: searchText });

    if (!orders || orders.length === 0) {
      return new NextResponse('No orders found', { status: 404 });
    }

    // Prepare headers and data
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

    // Create or get spreadsheet
    const eventTitle = orders[0]?.event.title || 'Untitled';
    const spreadsheetId = await createOrGetSpreadsheet(`${eventTitle}_Data`);

    if (!spreadsheetId) {
      throw new Error('Failed to create or get spreadsheet');
    }

    // Clear existing data and append new data
    await clearSheet(spreadsheetId, 'Sheet1!A1:Z');
    await appendToSheet(spreadsheetId, 'Sheet1!A1', [headers, ...data]);

    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: 'Data exported to Google Sheets successfully',
      spreadsheetId 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    return new NextResponse('Error exporting to Google Sheets', { status: 500 });
  }
} 