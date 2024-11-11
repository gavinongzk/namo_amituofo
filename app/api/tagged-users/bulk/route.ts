import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const { users } = data;

    const formattedUsers = users.map((user: { phoneNumber: string; name: string }) => ({
      phoneNumber: formatPhoneNumber(user.phoneNumber),
      name: user.name || 'Unknown',
      remarks: 'Pre-existing user'
    }));

    // Validate phone numbers
    const invalidNumbers = formattedUsers.filter(
      user => !isValidPhoneNumber(user.phoneNumber)
    );

    if (invalidNumbers.length > 0) {
      return NextResponse.json({
        error: 'Invalid phone numbers found',
        invalidNumbers
      }, { status: 400 });
    }

    // Use bulkWrite for better performance
    await TaggedUser.bulkWrite(
      formattedUsers.map((user: { phoneNumber: string; name: string; remarks: string }) => ({
        updateOne: {
          filter: { phoneNumber: user.phoneNumber },
          update: { $setOnInsert: user },
          upsert: true
        }
      }))
    );

    return NextResponse.json({ 
      message: `Successfully processed ${formattedUsers.length} users`
    });
  } catch (error) {
    console.error('Error processing bulk upload:', error);
    return NextResponse.json({ error: 'Failed to process users' }, { status: 500 });
  }
}
