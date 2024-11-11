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
      createdAt: { $gte: new Date(date) }
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
          uniqueUsers.set(phoneField.value, {
            phoneNumber: phoneField.value,
            name: nameField?.value || 'Unknown',
            isNewUser: !uniqueUsers.has(phoneField.value)
          });
        }
      });
    });

    // 2. Get users from TaggedUsers collection
    const taggedUsers = await TaggedUser.find({ 
      isDeleted: false,
      createdAt: { $gte: new Date(date) }
    });

    // 3. Merge users from both sources
    taggedUsers.forEach(user => {
      if (!uniqueUsers.has(user.phoneNumber)) {
        uniqueUsers.set(user.phoneNumber, {
          phoneNumber: user.phoneNumber,
          name: user.name,
          isNewUser: false,
          remarks: user.remarks,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
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
