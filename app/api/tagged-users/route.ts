import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { phoneNumber, name, remarks } = await req.json();
    
    // Ensure remarks can be an empty string
    const taggedUser = await TaggedUser.findOneAndUpdate(
      { phoneNumber },
      { phoneNumber, name, remarks: remarks || '' }, // Save as empty string if remarks is undefined
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

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { phoneNumber } = await req.json();
    
    const deletedUser = await TaggedUser.findOneAndDelete({ phoneNumber });
    
    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting tagged user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
