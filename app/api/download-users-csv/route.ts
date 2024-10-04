import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';
import { getAllUniquePhoneNumbers } from '@/lib/actions/user.actions';
import { currentUser } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch the user's country from Clerk
    const superadminCountry = user.publicMetadata.country as string;

    if (!superadminCountry) {
      return new NextResponse('Country not set for superadmin', { status: 400 });
    }

    const users = await getAllUniquePhoneNumbers(superadminCountry);

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
