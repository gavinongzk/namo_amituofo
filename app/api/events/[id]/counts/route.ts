import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/index';
import Order from '@/lib/database/models/order.model';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
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
    const counts = result[0] || { 
      totalRegistrations: 0, 
      attendedUsers: 0, 
      cannotReciteAndWalk: 0 
    };
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching registration counts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
