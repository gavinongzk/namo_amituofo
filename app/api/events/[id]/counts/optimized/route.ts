import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { ObjectId } from 'mongodb';
import { unstable_cache } from 'next/cache';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const cacheKey = `event-counts-${eventId}`;
    
    const result = await unstable_cache(
      async () => {
        await connectToDatabase();
        
        // Use simple queries instead of complex aggregation for better performance
        const [totalRegistrations, attendedUsers, cannotReciteAndWalk] = await Promise.all([
          Order.countDocuments({
            event: new ObjectId(eventId),
            'customFieldValues.cancelled': { $ne: true }
          }),
          Order.countDocuments({
            event: new ObjectId(eventId),
            'customFieldValues.cancelled': { $ne: true },
            'customFieldValues.attendance': true
          }),
          Order.countDocuments({
            event: new ObjectId(eventId),
            'customFieldValues.cancelled': { $ne: true },
            'customFieldValues.fields': {
              $elemMatch: {
                label: { $regex: /walk/i },
                value: { $in: ['no', '否', false] }
              }
            }
          })
        ]);
        
        return {
          totalRegistrations,
          attendedUsers,
          cannotReciteAndWalk
        };
      },
      [cacheKey],
      { 
        revalidate: 60, // Cache for 1 minute
        tags: [`event-${eventId}`, 'event-counts']
      }
    )();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching registration counts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
