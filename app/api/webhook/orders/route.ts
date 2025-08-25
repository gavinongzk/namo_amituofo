import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import TaggedUser from '@/lib/database/models/taggedUser.model';
import { CustomFieldGroup, CustomField } from '@/types';

interface TaggedUserDetails {
  phoneNumber: string | undefined;
  name: string;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { order } = await req.json();

    // Extract phone numbers and names from order
    const userDetails = order.customFieldValues.map((group: CustomFieldGroup): TaggedUserDetails => {
      const phoneField = group.fields.find((field: CustomField) => 
        field.label.toLowerCase().includes('phone') || 
        field.label.toLowerCase().includes('contact number')
      );
      const nameField = group.fields.find((field: CustomField) => 
        field.label.toLowerCase().includes('name')
      );

      return {
        phoneNumber: phoneField?.value as string | undefined,
        name: nameField?.value as string || 'Unknown'
      };
    }).filter((user: TaggedUserDetails) => user.phoneNumber);

    // Bulk upsert to TaggedUser
    if (userDetails.length > 0) {
      await TaggedUser.bulkWrite(
        userDetails.map((user: TaggedUserDetails) => ({
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing order webhook:', error);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}
