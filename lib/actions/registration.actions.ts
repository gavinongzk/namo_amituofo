import { IRegistration } from '@/types';
import { connectToDatabase } from '../database';
import Order from '../database/models/order.model';
import Event from '../database/models/event.model';
import User from '../database/models/user.model';

export const getRegistrationsByUser = async (userId: string): Promise<IRegistration[]> => {
  try {
    await connectToDatabase();

    const orders = await Order.find({ buyer: userId })
      .populate({
        path: 'event',
        select: '_id title imageUrl organizer attendeeCount', // Specify the fields to populate
        populate: {
          path: 'organizer',
          select: '_id', // Populate the organizer field if it's a reference
        },
      })
      .exec();

    const registrations: IRegistration[] = orders.map(order => ({
      event: {
        _id: order.event._id.toString(),
        title: order.event.title,
        imageUrl: order.event.imageUrl,
        organizer: order.event.organizer,
        orderId: order._id?.toString(), // Use optional chaining
        customFieldValues: order.customFieldValues ?? [], // Use optional chaining
        queueNumber: order.queueNumber ?? '', // Use optional chaining
        attendeeCount: order.attendeeCount ?? 0, // Use optional chaining
      },
      registrations: [{
        queueNumber: order.queueNumber ?? '', // Use optional chaining
        name: order.customFieldValues?.find((field: { label: string, value: string }) => field.label.toLowerCase().includes('name'))?.value || 'Unknown',
      }]
    }));

    return registrations;
  } catch (error) {
    console.error('Error in getRegistrationsByUser:', error);
    throw new Error('Failed to fetch registrations');
  }
};
