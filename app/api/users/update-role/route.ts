import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';
import { clerkClient } from '@clerk/nextjs';
import { ObjectId } from 'mongodb';

export async function PATCH(req: NextRequest) {
  if (req.method !== 'PATCH') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    await connectToDatabase();
    const { userId, newRole } = await req.json();

    // Validate newRole
    if (!['user', 'admin', 'superadmin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Update user in your database using _id
    const updatedUser = await User.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { role: newRole },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update Clerk user metadata
    await clerkClient.users.updateUser(updatedUser.clerkId, {
      publicMetadata: {
        role: newRole
      }
    });

    return NextResponse.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
