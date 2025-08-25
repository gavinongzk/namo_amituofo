import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { phoneNumber, name, remarks } = await req.json();
    
    const now = new Date().toISOString();
    const taggedUser = await TaggedUser.findOneAndUpdate(
      { phoneNumber },
      { 
        phoneNumber, 
        name, 
        remarks: remarks || '',
        updatedAt: now,
        $setOnInsert: { createdAt: now }
      },
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
    
    const users = await TaggedUser.find({ isDeleted: false });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { phoneNumber } = await req.json();
    
    await TaggedUser.updateOne(
      { phoneNumber },
      { 
        $set: { 
          isDeleted: true,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ message: 'User successfully deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
