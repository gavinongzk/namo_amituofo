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
    const sinceDate = date ? new Date(date) : undefined;

    // 1. Get users from Orders (select only required fields and avoid hydration)
    // NOTE: Order does not have isDeleted. Previous filter forced a full collection scan.
    const orders = await Order.find({}, {
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
            isNewUser: sinceDate ? (!createdAt || new Date(createdAt) >= sinceDate) : false,
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
          isNewUser: sinceDate ? (!user.createdAt || new Date(user.createdAt) >= sinceDate) : false,
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
          isNewUser: sinceDate ? (!earliestCreatedAt || new Date(earliestCreatedAt) >= sinceDate) : false
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
