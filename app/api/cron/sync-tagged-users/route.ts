import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import TaggedUser from '@/lib/database/models/taggedUser.model';
import { CustomFieldGroup } from '@/types';

export async function POST(req: Request) {
  try {
    // Verify cron secret to ensure authorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get recent orders (e.g., last 24 hours)
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const recentOrders = await Order.find({
      createdAt: { $gte: cutoffDate }
    });

    // Extract unique users from orders
    const userMap = new Map();
    recentOrders.forEach(order => {
      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || 
          field.label.toLowerCase().includes('contact number')
        );
        const nameField = group.fields.find(field => 
          field.label.toLowerCase().includes('name')
        );

        if (phoneField?.value) {
          userMap.set(phoneField.value, {
            phoneNumber: phoneField.value,
            name: nameField?.value || 'Unknown'
          });
        }
      });
    });

    // Bulk upsert to TaggedUser
    const users = Array.from(userMap.values());
    if (users.length > 0) {
      await TaggedUser.bulkWrite(
        users.map(user => ({
          updateOne: {
            filter: { phoneNumber: user.phoneNumber },
            update: { 
              $setOnInsert: {
                ...user,
                remarks: 'Auto-added from order',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            },
            upsert: true
          }
        }))
      );
    }

    return NextResponse.json({ 
      message: `Processed ${users.length} users`
    });
  } catch (error) {
    console.error('Error syncing tagged users:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
