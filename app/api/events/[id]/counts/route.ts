import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { ObjectId } from 'mongodb';
import { unstable_cache } from 'next/cache';

const getCachedCounts = unstable_cache(
  async (eventId: string) => {
    await connectToDatabase();
    
    const result = await Order.aggregate([
      { $match: { event: new ObjectId(eventId) } },
      { $unwind: '$customFieldValues' },
      {
        $group: {
          _id: null,
          totalRegistrations: {
            $sum: {
              $cond: [{ $eq: ['$customFieldValues.cancelled', false] }, 1, 0]
            }
          },
          attendedUsers: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$customFieldValues.cancelled', false] },
                  { $eq: ['$customFieldValues.attendance', true] }
                ]},
                1,
                0
              ]
            }
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
                          input: "$customFieldValues.fields",
                          as: "field",
                          in: {
                            $and: [
                              { $regexMatch: { input: "$$field.label", regex: /walk/i } },
                              { $in: ["$$field.value", ["no", "否", false]] }
                            ]
                          }
                        }
                      }
                    }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    return result[0] || { 
      totalRegistrations: 0, 
      attendedUsers: 0, 
      cannotReciteAndWalk: 0 
    };
  },
  ['event-counts'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['events', 'orders']
  }
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const counts = await getCachedCounts(eventId);

    return NextResponse.json(counts, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    console.error('Error fetching registration counts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
