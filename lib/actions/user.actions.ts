'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import User from '@/lib/database/models/user.model'
import Order from '@/lib/database/models/order.model'
import Event from '@/lib/database/models/event.model'
import { handleError } from '@/lib/utils'

import { CreateUserParams, UpdateUserParams } from '@/types'

export async function createUser(user: CreateUserParams) {
  try {
    await connectToDatabase()

    const newUser = await User.create(user)
    return JSON.parse(JSON.stringify(newUser))
  } catch (error) {
    handleError(error)
  }
}

export async function getUserById(userId: string) {
  try {
    await connectToDatabase()

    const user = await User.findById(userId)

    if (!user) throw new Error('User not found')
    return JSON.parse(JSON.stringify(user))
  } catch (error) {
    handleError(error)
  }
}

export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase()

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, { new: true })

    if (!updatedUser) throw new Error('User update failed')
    return JSON.parse(JSON.stringify(updatedUser))
  } catch (error) {
    handleError(error)
  }
}

export async function deleteUser(clerkId: string) {
  try {
    await connectToDatabase()

    // Find user to delete
    const userToDelete = await User.findOne({ clerkId })

    if (!userToDelete) {
      throw new Error('User not found')
    }

    // Unlink relationships
    await Promise.all([
      // Update the 'events' collection to remove references to the user
      Event.updateMany(
        { _id: { $in: userToDelete.events } },
        { $pull: { organizer: userToDelete._id } }
      ),

      // Update the 'orders' collection to remove references to the user
      Order.updateMany({ _id: { $in: userToDelete.orders } }, { $unset: { buyer: 1 } }),
    ])

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userToDelete._id)
    revalidatePath('/')

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null
  } catch (error) {
    handleError(error)
  }
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin' | 'superadmin') {
  try {
    const response = await fetch('/api/users/update-role', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, newRole }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user role');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

export async function getAllUsers() {
  try {
    await connectToDatabase();
    const users = await User.find().select('_id firstName lastName phoneNumber role');
    return users.map(user => ({
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber,
      role: user.role,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function downloadUserPhoneNumbers() {
  try {
    await connectToDatabase();
    const users = await User.find().select('firstName lastName phoneNumber');
    const csvContent = users.map(user => `${user.firstName},${user.lastName},${user.phoneNumber}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'user_phone_numbers.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error downloading phone numbers:', error);
    throw error;
  }
}

export async function getUserForAdmin(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findById(userId).select('_id firstName lastName phoneNumber role');

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function updateUserCountry(userId: string, country: string) {
  try {
    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { country },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('User not found');
    }

    revalidatePath('/profile');

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}
