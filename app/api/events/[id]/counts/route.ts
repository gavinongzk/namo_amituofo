import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    await connectToDatabase();

    const eventId = params.eventId;

    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    // Aggregate to get total and active registrations
    const result = await Order.aggregate([
      { $match: { event: new ObjectId(eventId) } },
      { $unwind: '$customFieldValues' },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          activeRegistrations: {
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
          }
        }
      }
    ]);

    const counts = result[0] || { totalRegistrations: 0, activeRegistrations: 0, attendedUsers: 0 };

    return NextResponse.json({
      totalRegistrations: counts.totalRegistrations,
      activeRegistrations: counts.activeRegistrations,
      attendedUsers: counts.attendedUsers
    });

  } catch (error) {
    console.error('Error fetching registration counts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
