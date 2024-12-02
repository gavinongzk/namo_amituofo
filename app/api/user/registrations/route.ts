import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { unstable_cache } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

const getCachedRegistrations = unstable_cache(
  async (phone: string) => {
    await connectToDatabase();

    // Optimize query with lean() and field selection
    const orders = await Order.find({
      'customFieldValues.fields': {
        $elemMatch: {
          type: 'phone',
          value: phone
        }
      }
    })
    .select('event customFieldValues')
    .populate('event', 'title imageUrl startDateTime endDateTime organizer')
    .lean();

    if (!orders?.length) {
      return [];
    }

    // Process in memory for better performance
    const registrationsMap = new Map();

    orders.forEach(order => {
      const eventId = order.event._id.toString();
      
      if (!registrationsMap.has(eventId)) {
        registrationsMap.set(eventId, {
          eventId,
          eventTitle: order.event.title,
          registrations: []
        });
      }

      const eventRegistrations = registrationsMap.get(eventId);

      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        const nameField = group.fields.find(
          (field: CustomField) => field.label.toLowerCase().includes('name')
        );
        
        if (nameField) {
          eventRegistrations.registrations.push({
            queueNumber: order.queueNumber,
            name: nameField.value
          });
        }
      });
    });

    return Array.from(registrationsMap.values());
  },
  ['user-registrations'],
  {
    revalidate: 30,
    tags: ['registrations']
  }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const registrations = await getCachedRegistrations(phone);
    
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
