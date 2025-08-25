import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';
import { isValidPhoneNumber, formatPhoneNumber } from '@/lib/utils';

interface TaggedUserInput {
  phoneNumber: string;
  name: string;
  remarks: string;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const { users } = data;

    const formattedUsers = users.map((user: { phoneNumber: string; name: string }) => ({
      phoneNumber: formatPhoneNumber(user.phoneNumber),
      name: user.name || 'Unknown',
      remarks: ''
    } as TaggedUserInput));

    // Validate phone numbers and separate valid/invalid users
    const validUsers: TaggedUserInput[] = [];
    const invalidNumbers: TaggedUserInput[] = [];

    formattedUsers.forEach((user: TaggedUserInput) => {
      if (isValidPhoneNumber(user.phoneNumber)) {
        validUsers.push(user);
      } else {
        invalidNumbers.push(user);
      }
    });

    let processedCount = 0;
    if (validUsers.length > 0) {
      // Use bulkWrite for better performance with valid users
      const bulkWriteResult = await TaggedUser.bulkWrite(
        validUsers.map((user: TaggedUserInput) => ({
          updateOne: {
            filter: { phoneNumber: user.phoneNumber },
            update: {
              $setOnInsert: {
                ...user,
                createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Set date to 30 days ago
                updatedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
              }
            },
            upsert: true
          }
        }))
      );
      processedCount = bulkWriteResult.upsertedCount + bulkWriteResult.modifiedCount;
    }

    if (invalidNumbers.length > 0) {
      if (processedCount > 0) {
        // Some users processed, some failed
        return NextResponse.json({
          message: `Successfully processed ${processedCount} users.`,
          error: 'Some phone numbers were invalid.',
          invalidNumbers
        }, { status: 207 }); // Multi-Status
      } else {
        // All users had invalid numbers
        return NextResponse.json({
          error: 'All phone numbers provided were invalid.',
          invalidNumbers
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${processedCount} users.`
    });
  } catch (error) {
    console.error('Error processing bulk upload:', error);
    return NextResponse.json({ error: 'Failed to process users' }, { status: 500 });
  }
}
