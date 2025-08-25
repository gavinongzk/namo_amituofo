import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/index';
import TaggedUser from '@/lib/database/models/taggedUser.model';
import Order from '@/lib/database/models/order.model';
import { CustomFieldGroup } from '@/types';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { date, country } = await req.json();

    // 1. Get users from Orders
    const query = {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    };

    const orders = await Order.find(query);
    const uniqueUsers = new Map();

    orders.forEach(order => {
      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || 
          field.label.toLowerCase().includes('contact number')
        );
        const nameField = group.fields.find(field => 
          field.label.toLowerCase().includes('name')
        );

        if (phoneField?.value) {
          const existingUser = uniqueUsers.get(phoneField.value);
          const orderCreatedAt = order.createdAt;

          const createdAt = existingUser?.createdAt 
            ? new Date(existingUser.createdAt) < new Date(orderCreatedAt)
              ? existingUser.createdAt
              : orderCreatedAt
            : orderCreatedAt;

          uniqueUsers.set(phoneField.value, {
            phoneNumber: phoneField.value,
            name: nameField?.value || existingUser?.name || 'Unknown',
            isNewUser: !createdAt || new Date(createdAt) >= new Date(date),
            createdAt
          });
        }
      });
    });

    // 2. Get users from TaggedUsers collection
    const taggedUsers = await TaggedUser.find({ 
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    // 3. Merge users from both sources
    taggedUsers.forEach(user => {
      const existingUser = uniqueUsers.get(user.phoneNumber);
      if (!existingUser) {
        uniqueUsers.set(user.phoneNumber, {
          phoneNumber: user.phoneNumber,
          name: user.name,
          isNewUser: !user.createdAt || new Date(user.createdAt) >= new Date(date),
          remarks: user.remarks,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      } else {
        const earliestCreatedAt = existingUser.createdAt && user.createdAt
          ? new Date(existingUser.createdAt) < new Date(user.createdAt)
            ? existingUser.createdAt
            : user.createdAt
          : existingUser.createdAt || user.createdAt;

        uniqueUsers.set(user.phoneNumber, {
          ...existingUser,
          remarks: user.remarks,
          createdAt: earliestCreatedAt,
          updatedAt: user.updatedAt,
          isNewUser: !earliestCreatedAt || new Date(earliestCreatedAt) >= new Date(date)
        });
      }
    });

    const users = Array.from(uniqueUsers.values());

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error syncing users:', error);
    return NextResponse.json({ error: 'Failed to sync users' }, { status: 500 });
  }
}
