'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import User from '@/lib/database/models/user.model'
import Order from '@/lib/database/models/order.model'
import Event from '@/lib/database/models/event.model'
import { handleError } from '@/lib/utils'

import { CreateUserParams, UpdateUserParams, CustomFieldGroup, UniquePhoneNumber } from '@/types'
import { Types } from 'mongoose';

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
    const users = await User.find().select('_id phoneNumber role');
    return users.map(user => ({
      id: user._id.toString(),
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
    const users = await User.find().select('phoneNumber');
    const csvContent = users.map(user => `${user.phoneNumber}`).join('\n');
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

    const user = await User.findById(userId).select('_id phoneNumber role');

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function getAllUniquePhoneNumbers(superadminCountry: string, customDate?: string) {
  try {
    await connectToDatabase();

    const cutoffDate = customDate ? new Date(customDate) : new Date();
    cutoffDate.setHours(0, 0, 0, 0); // Set to start of the day

    // Fetch events for the specific country
    const countryEvents = await Event.find({ country: superadminCountry }).select('_id');
    const countryEventIds = countryEvents.map(event => event._id);

    // Fetch orders only for events in the superadmin's country
    const orders = await Order.find({ event: { $in: countryEventIds } }).select('customFieldValues createdAt');
    
    const phoneMap = new Map<string, { count: number; firstOrderDate: Date }>();
    const userList: UniquePhoneNumber[] = [];

    orders.forEach(order => {
      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || 
          field.label.toLowerCase().includes('contact number')
        );
        if (phoneField && typeof phoneField.value === 'string') {
          const existingData = phoneMap.get(phoneField.value);
          if (!existingData || order.createdAt < existingData.firstOrderDate) {
            phoneMap.set(phoneField.value, {
              count: (existingData?.count || 0) + 1,
              firstOrderDate: order.createdAt
            });
          } else {
            phoneMap.set(phoneField.value, {
              count: existingData.count + 1,
              firstOrderDate: existingData.firstOrderDate
            });
          }
        }
      });
    });

    for (const [phoneNumber, data] of Array.from(phoneMap)) {
      const order = orders.find(order => 
        order.customFieldValues.some((group: CustomFieldGroup) => 
          group.fields.some(field => 
            (field.label.toLowerCase().includes('phone') || field.label.toLowerCase().includes('contact number')) 
            && field.value === phoneNumber
          )
        )
      );

      if (order) {
        const group = order.customFieldValues.find((group: CustomFieldGroup) => 
          group.fields.some(field => 
            (field.label.toLowerCase().includes('phone') || field.label.toLowerCase().includes('contact number')) 
            && field.value === phoneNumber
          )
        );

        if (group) {
          const nameField = group.fields.find((field: { label: string }) => field.label.toLowerCase().includes('name'));

          userList.push({
            phoneNumber,
            isNewUser: data.firstOrderDate >= cutoffDate,
            name: nameField ? nameField.value : 'Unknown'
          });
        }
      }
    }

    return userList;
  } catch (error) {
    console.error('Error fetching unique phone numbers:', error);
    throw error;
  }
}