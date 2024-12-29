import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import Event from '@/lib/database/models/event.model';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

const REGISTRATION_LOCK_TIMEOUT = 30000; // 30 seconds
const MAX_CONCURRENT_REGISTRATIONS = 5;

export async function POST(req: NextRequest) {
  try {
    const { eventId, customFieldValues } = await req.json();
    const headersList = headers();
    const clientId = headersList.get('x-client-id') || 'anonymous';

    await connectToDatabase();

    // Start a session for atomic operations
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Check if event exists and is not full
      const event = await Event.findById(eventId).session(session);
      if (!event) {
        throw new Error('Event not found');
      }

      // Get current registration count with lock
      const currentRegistrations = await Order.countDocuments({ 
        event: eventId,
        'customFieldValues.cancelled': { $ne: true }
      }).session(session);

      // Check if event is full
      const totalNewRegistrations = customFieldValues.length;
      if (currentRegistrations + totalNewRegistrations > event.maxSeats) {
        throw new Error('Event is fully booked');
      }

      // Check concurrent registrations for this client
      const concurrentRegistrations = await Order.countDocuments({
        clientId,
        createdAt: { $gt: new Date(Date.now() - REGISTRATION_LOCK_TIMEOUT) }
      }).session(session);

      if (concurrentRegistrations >= MAX_CONCURRENT_REGISTRATIONS) {
        throw new Error('Too many registration attempts. Please wait a moment.');
      }

      // Generate queue numbers
      const lastOrder = await Order.findOne({ event: eventId })
        .sort({ 'customFieldValues.queueNumber': -1 })
        .session(session);

      let lastQueueNumber = 0;
      if (lastOrder && lastOrder.customFieldValues.length > 0) {
        const maxQueueNumber = Math.max(...lastOrder.customFieldValues
          .map(group => parseInt(group.queueNumber || '0')));
        lastQueueNumber = maxQueueNumber;
      }

      // Add queue numbers to customFieldValues
      const enrichedCustomFieldValues = customFieldValues.map((group: any, index: number) => ({
        ...group,
        queueNumber: String(lastQueueNumber + index + 1).padStart(4, '0')
      }));

      // Create the order with optimistic locking
      const order = new Order({
        event: eventId,
        customFieldValues: enrichedCustomFieldValues,
        clientId,
        version: 0, // For optimistic locking
        createdAt: new Date()
      });

      await order.save({ session });

      // Update event registration count
      await Event.findByIdAndUpdate(
        eventId,
        { 
          $inc: { currentRegistrations: totalNewRegistrations },
          $set: { lastUpdated: new Date() }
        },
        { session, new: true }
      );

      // Commit the transaction
      await session.commitTransaction();

      // Revalidate relevant paths
      revalidatePath(`/events/${eventId}`);
      revalidatePath('/');

      return NextResponse.json({ 
        message: 'Registration successful',
        order
      });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error in createOrder:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Registration failed',
        error: true
      },
      { status: 400 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({ status: 'OK' }, { status: 200 });
}