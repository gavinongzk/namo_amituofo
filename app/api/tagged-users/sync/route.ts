import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';
import Order from '@/lib/database/models/order.model';
import { CustomFieldGroup } from '@/types';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { date, country } = await req.json();

    // Get unique phone numbers from Orders
    const query = {
      'metadata.country': country,
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

    const users = Array.from(uniqueUsers.values());

    // Sync with TaggedUsers
    await TaggedUser.bulkWrite(
      users.map((user: { phoneNumber: string; name: string; remarks: string }) => ({
        updateOne: {
          filter: { 
            phoneNumber: user.phoneNumber,
            isDeleted: false
          },
          update: { 
            $setOnInsert: {
              ...user,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      }))
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error syncing users:', error);
    return NextResponse.json({ error: 'Failed to sync users' }, { status: 500 });
  }
}
