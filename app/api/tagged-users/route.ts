import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { phoneNumber, name, remarks } = await req.json();
    
    const taggedUser = await TaggedUser.findOneAndUpdate(
      { phoneNumber },
      { phoneNumber, name, remarks },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: 'User remarks updated successfully', taggedUser });
  } catch (error) {
    console.error('Error updating user remarks:', error);
    return NextResponse.json({ error: 'Failed to update user remarks' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const taggedUsers = await TaggedUser.find();
    return NextResponse.json(taggedUsers);
  } catch (error) {
    console.error('Error fetching tagged users:', error);
    return NextResponse.json({ error: 'Failed to fetch tagged users' }, { status: 500 });
  }
}
