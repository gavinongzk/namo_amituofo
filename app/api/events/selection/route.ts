import { NextRequest, NextResponse } from 'next/server';
import { getEventsForSelection } from '@/lib/actions/event.actions';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { Types } from 'mongoose';
import { auth, currentUser } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'Singapore';
    const { userId } = await auth();
    
    // Get user and their role from metadata
    let role: string | undefined;
    if (userId) {
      const user = await currentUser();
      role = user?.publicMetadata?.role as string;
    }
    
    const events = await getEventsForSelection({ country, role });
    await connectToDatabase();

    const eventIds = events
      .map((event: any) => String(event?._id))
      .filter((id: string) => Types.ObjectId.isValid(id))
      .map((id: string) => new Types.ObjectId(id));
    let countsByEventId = new Map<string, { totalRegistrations: number; attendedUsers: number; cannotReciteAndWalk: number }>();

    if (eventIds.length > 0) {
      const counts = await Order.aggregate([
        {
          $match: {
            event: { $in: eventIds },
          },
        },
        { $unwind: '$customFieldValues' },
        {
          $group: {
            _id: '$event',
            totalRegistrations: {
              $sum: {
                $cond: [{ $eq: ['$customFieldValues.cancelled', false] }, 1, 0],
              },
            },
            attendedUsers: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$customFieldValues.cancelled', false] },
                      { $eq: ['$customFieldValues.attendance', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            cannotReciteAndWalk: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$customFieldValues.cancelled', false] },
                      {
                        $anyElementTrue: {
                          $map: {
                            input: '$customFieldValues.fields',
                            as: 'field',
                            in: {
                              $and: [
                                { $regexMatch: { input: '$$field.label', regex: /walk/i } },
                                { $in: ['$$field.value', ['no', '否', false]] },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      countsByEventId = new Map(
        counts.map((count) => [
          String(count._id),
          {
            totalRegistrations: count.totalRegistrations ?? 0,
            attendedUsers: count.attendedUsers ?? 0,
            cannotReciteAndWalk: count.cannotReciteAndWalk ?? 0,
          },
        ])
      );
    }

    const enrichedEvents = events.map((event: any) => {
      const eventId = String(event._id);
      const counts = countsByEventId.get(eventId) ?? {
        totalRegistrations: 0,
        attendedUsers: 0,
        cannotReciteAndWalk: 0,
      };

      return {
        ...event,
        totalRegistrations: counts.totalRegistrations,
        attendedUsers: counts.attendedUsers,
        cannotReciteAndWalk: counts.cannotReciteAndWalk,
      };
    });
    
    return new NextResponse(JSON.stringify({ data: enrichedEvents }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('Error fetching events for selection:', error);
    return NextResponse.json(
      { message: 'Failed to fetch events', data: [] }, 
      { status: 500 }
    );
  }
}
