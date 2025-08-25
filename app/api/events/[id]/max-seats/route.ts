import { connectToDatabase } from '@/lib/database/index';
import Event from '@/lib/database/models/event.model';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { maxSeats } = await req.json();

    const updatedEvent = await Event.findByIdAndUpdate(
      params.id,
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
