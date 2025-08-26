import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';
import Order from '@/lib/database/models/order.model';
import { CustomFieldGroup } from '@/types';

// Allow longer execution when needed (Vercel up to 60s on appropriate plans)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { date } = await req.json();

    // 1. Get users from Orders (select only required fields and avoid hydration)
    // Preserve original filter shape (matches all docs when field absent)
    const query = {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    } as unknown as Record<string, unknown>;

    const orders = await Order.find(query, {
      createdAt: 1,
      'customFieldValues.fields.label': 1,
      'customFieldValues.fields.value': 1,
    }).lean();
    const uniqueUsers = new Map();

    orders.forEach(order => {
      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        let phoneValue: string | undefined;
        let nameValue: string | undefined;
        for (const field of group.fields) {
          const labelLower = (field.label || '').toLowerCase();
          if (!phoneValue && (labelLower.includes('phone') || labelLower.includes('contact number'))) {
            if (typeof field.value === 'string') phoneValue = field.value;
          }
          if (!nameValue && labelLower.includes('name')) {
            if (typeof field.value === 'string') nameValue = field.value;
          }
          if (phoneValue && nameValue) break;
        }

        if (phoneValue) {
          const existingUser = uniqueUsers.get(phoneValue);
          const orderCreatedAt = order.createdAt;

          const createdAt = existingUser?.createdAt 
            ? new Date(existingUser.createdAt) < new Date(orderCreatedAt)
              ? existingUser.createdAt
              : orderCreatedAt
            : orderCreatedAt;

          uniqueUsers.set(phoneValue, {
            phoneNumber: phoneValue,
            name: nameValue || existingUser?.name || 'Unknown',
            // Keep original logic shape
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
    }, {
      phoneNumber: 1,
      name: 1,
      remarks: 1,
      createdAt: 1,
      updatedAt: 1,
    }).lean();

    // 3. Merge users from both sources
    taggedUsers.forEach(user => {
      const existingUser = uniqueUsers.get(user.phoneNumber);
      if (!existingUser) {
        uniqueUsers.set(user.phoneNumber, {
          phoneNumber: user.phoneNumber,
          name: user.name,
          // Keep original logic shape
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
          // Keep original logic shape
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
