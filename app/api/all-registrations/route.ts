import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { unstable_cache } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

const getCachedAllRegistrations = unstable_cache(
  async (phoneNumber: string) => {
    await connectToDatabase();

    // Find all orders that have this phone number
    const orders = await Order.find({
      'customFieldValues.fields': {
        $elemMatch: {
          type: 'phone',
          value: phoneNumber
        }
      }
    })
    .populate({
      path: 'event',
      select: '_id title imageUrl startDateTime endDateTime organizer category',
      populate: {
        path: 'category',
        select: 'name'
      }
    })
    .lean();

    if (!orders?.length) {
      return [];
    }

    // Process orders into registrations
    const registrationsMap = new Map();

    orders.forEach(order => {
      const eventId = order.event._id.toString();
      
      if (!registrationsMap.has(eventId)) {
        registrationsMap.set(eventId, {
          event: {
            _id: eventId,
            title: order.event.title,
            imageUrl: order.event.imageUrl,
            startDateTime: order.event.startDateTime,
            endDateTime: order.event.endDateTime,
            organizer: order.event.organizer,
            category: order.event.category,
            orderId: order._id.toString(),
            customFieldValues: order.customFieldValues
          },
          registrations: [],
          orderIds: [order._id.toString()]
        });
      } else {
        // Add order ID to the list if it's not already there
        const registration = registrationsMap.get(eventId);
        if (!registration.orderIds.includes(order._id.toString())) {
          registration.orderIds.push(order._id.toString());
        }
      }

      const registration = registrationsMap.get(eventId);

      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        const nameField = group.fields.find(
          (field: CustomField) => field.label.toLowerCase().includes('name')
        );
        
        if (nameField) {
          registration.registrations.push({
            queueNumber: group.queueNumber,
            name: nameField.value,
            orderId: order._id.toString()
          });
        }
      });
    });

    return Array.from(registrationsMap.values());
  },
  ['all-registrations'],
  {
    revalidate: 30,
    tags: ['registrations']
  }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const registrations = await getCachedAllRegistrations(phoneNumber);
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json(registrations);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching all registrations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 