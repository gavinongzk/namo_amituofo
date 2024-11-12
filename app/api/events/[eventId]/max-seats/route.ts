import { connectToDatabase } from '@/lib/database';
import Event from '@/lib/database/models/event.model';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    await connectToDatabase();

    const { maxSeats } = await req.json();

    const updatedEvent = await Event.findByIdAndUpdate(
      params.eventId,
      { maxSeats },
      { new: true }
    );

    if (!updatedEvent) {
      return new NextResponse('Event not found', { status: 404 });
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating max seats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
