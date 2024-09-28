import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import { getAllUniquePhoneNumbers } from '@/lib/actions/user.actions';

export async function GET(request: NextRequest) {
  try {
    const users = await getAllUniquePhoneNumbers();

    const headers = ['Name', 'Phone Number', 'Status'];
    const data = users.map(user => [
      user.name,
      user.phoneNumber,
      user.isNewUser ? 'New' : 'Existing'
    ]);

    const csvString = stringify([headers, ...data]);

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=user_phone_numbers.csv',
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return new NextResponse('Error generating CSV', { status: 500 });
  }
}
