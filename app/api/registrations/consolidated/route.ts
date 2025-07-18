import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { unstable_cache } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';
import { Types } from 'mongoose';
import { auth } from '@clerk/nextjs';

interface ConsolidatedRegistrationData {
  recentRegistrations: any[];
  allRegistrations: any[];
  userRegistrations: any[];
  totalCount: number;
}

const getCachedConsolidatedRegistrations = unstable_cache(
  async (phoneNumber: string, includeCancelled: boolean = false) => {
    await connectToDatabase();

    // Single query to get all orders for this phone number
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
    .sort({ createdAt: -1 })
    .lean();

    if (!orders?.length) {
      return {
        recentRegistrations: [],
        allRegistrations: [],
        userRegistrations: [],
        totalCount: 0
      };
    }

    // Process orders into different formats
    const recentRegistrations: any[] = [];
    const allRegistrations: any[] = [];
    const userRegistrations: any[] = [];
    const registrationsMap = new Map();
    
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    orders.forEach((order: any) => {
      const eventId = order.event._id.toString();
      const orderDate = new Date(order.createdAt);
      const isRecent = orderDate >= oneMonthAgo;

      order.customFieldValues.forEach((group: CustomFieldGroup) => {
        const phoneField = group.fields.find((field: CustomField) => 
          field.type === 'phone' && field.value === phoneNumber
        );
        
        if (phoneField) {
          const nameField = group.fields.find((field: CustomField) => 
            field.label.toLowerCase().includes('name')
          );
          
          const registration = {
            id: `${order._id}_${group.groupId}`,
            eventTitle: order.event.title,
            eventStartDateTime: order.event.startDateTime,
            eventEndDateTime: order.event.endDateTime,
            order: {
              _id: order._id,
              customFieldValues: [{
                ...group,
                fields: group.fields.map((field: CustomField) => ({
                  ...field,
                  value: field.value || '',
                })),
              }]
            },
            event: {
              _id: eventId,
              title: order.event.title,
              imageUrl: order.event.imageUrl,
              startDateTime: order.event.startDateTime,
              endDateTime: order.event.endDateTime,
              organizer: order.event.organizer,
              category: order.event.category,
            },
            queueNumber: group.queueNumber,
            name: nameField ? nameField.value : 'Unknown',
            cancelled: group.cancelled || false,
            attendance: group.attendance || false
          };

          // Add to recent registrations if not cancelled and is recent
          if (!group.cancelled && isRecent) {
            recentRegistrations.push(registration);
          }

          // Add to all registrations (include cancelled if requested)
          if (!group.cancelled || includeCancelled) {
            allRegistrations.push(registration);
          }

          // Group by event for user registrations
          if (!registrationsMap.has(eventId)) {
            registrationsMap.set(eventId, {
              eventId,
              eventTitle: order.event.title,
              registrations: []
            });
          }
          
          if (!group.cancelled) {
            registrationsMap.get(eventId).registrations.push({
              queueNumber: group.queueNumber,
              name: nameField ? nameField.value : 'N/A',
              orderId: order._id.toString()
            });
          }
        }
      });
    });

    // Sort by event date
    recentRegistrations.sort((a, b) => 
      new Date(a.event.startDateTime).getTime() - new Date(b.event.startDateTime).getTime()
    );
    
    allRegistrations.sort((a, b) => 
      new Date(a.event.startDateTime).getTime() - new Date(b.event.startDateTime).getTime()
    );

    userRegistrations.push(...Array.from(registrationsMap.values()));

    return {
      recentRegistrations,
      allRegistrations,
      userRegistrations,
      totalCount: allRegistrations.length
    };
  },
  ['consolidated-registrations'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['registrations']
  }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneNumber = searchParams.get('phoneNumber');
    const includeCancelled = searchParams.get('includeCancelled') === 'true';

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if user is superadmin when includeCancelled is true
    if (includeCancelled) {
      const { sessionClaims } = auth();
      const role = sessionClaims?.role as string;
      
      if (role !== 'superadmin') {
        return NextResponse.json(
          { message: 'Unauthorized: Only superadmins can view cancelled registrations' }, 
          { status: 403 }
        );
      }
    }

    const data = await getCachedConsolidatedRegistrations(phoneNumber, includeCancelled);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching consolidated registrations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 