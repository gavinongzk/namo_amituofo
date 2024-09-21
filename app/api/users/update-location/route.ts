import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';

export async function POST(req: Request) {
  try {
    const { userId, customLocation } = await req.json();
    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { customLocation },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating user location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}
