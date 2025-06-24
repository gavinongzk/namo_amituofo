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
    const { userId, newRole, region } = await req.json();

    // Validate newRole
    if (!['user', 'admin', 'superadmin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate region if provided
    if (region && !['Singapore', 'Malaysia-JB', 'Malaysia-KL'].includes(region)) {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    }

    // Validate userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prepare update data
    const updateData: { role: string; region?: string } = { role: newRole };
    if (region) {
      updateData.region = region;
    }

    // Update user in your database using _id
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      console.error('User not found or update failed');
      return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
    }

    console.log('User role updated successfully:', updatedUser);

    // Update Clerk user metadata
    const clerkMetadata: { role: string; region?: string } = { role: newRole };
    if (region) {
      clerkMetadata.region = region;
    }

    await clerkClient.users.updateUser(updatedUser.clerkId, {
      publicMetadata: clerkMetadata
    });

    return NextResponse.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
