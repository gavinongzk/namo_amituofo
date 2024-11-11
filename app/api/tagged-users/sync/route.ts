import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { users } = await req.json();
    
    await TaggedUser.bulkWrite(
      users.map((user: { phoneNumber: string; name: string; remarks: string }) => ({
        updateOne: {
          filter: { 
            phoneNumber: user.phoneNumber,
            isDeleted: false
          },
          update: { 
            $setOnInsert: {
              ...user,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      }))
    );

    return NextResponse.json({ 
      message: `Successfully synced ${users.length} users`
    });
  } catch (error) {
    console.error('Error syncing users:', error);
    return NextResponse.json({ error: 'Failed to sync users' }, { status: 500 });
  }
}
