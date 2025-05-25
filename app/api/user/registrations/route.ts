import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { CustomFieldGroup, CustomField } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    if (!phone) {
      return NextResponse.json([]);
    }
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
      return NextResponse.json([]);
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
    return NextResponse.json(Array.from(registrationsMap.values()));
  } catch (error) {
    return NextResponse.json([]);
  }
}
