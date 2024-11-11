import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';
import Order from '@/lib/database/models/order.model';
import { CustomFieldGroup } from '@/types';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { date, country } = await req.json();

    // 1. Get users from Orders
    const query = {
        isDeleted: false,
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
          const isNewUser = !existingUser || 
            (!existingUser.createdAt || new Date(existingUser.createdAt) >= new Date(date));

          uniqueUsers.set(phoneField.value, {
            phoneNumber: phoneField.value,
            name: nameField?.value || 'Unknown',
            isNewUser,
            ...(existingUser && { createdAt: existingUser.createdAt })
          });
        }
      });
    });

    // 2. Get users from TaggedUsers collection
    const taggedUsers = await TaggedUser.find({ 
      isDeleted: false,
    });

    // 3. Merge users from both sources
    taggedUsers.forEach(user => {
      if (!uniqueUsers.has(user.phoneNumber)) {
        uniqueUsers.set(user.phoneNumber, {
          phoneNumber: user.phoneNumber,
          name: user.name,
          isNewUser: !user.createdAt || new Date(user.createdAt) >= new Date(date),
          remarks: user.remarks,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
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
