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

    const eventMap: { [key: string]: IRegistration } = {};

    orders.forEach(order => {
      const eventId = order.event._id.toString();
      if (!eventMap[eventId]) {
        eventMap[eventId] = {
          event: {
            _id: eventId,
            title: order.event.title,
            imageUrl: order.event.imageUrl,
            organizer: order.event.organizer,
            orderId: order._id?.toString(), // Use optional chaining
            customFieldValues: order.customFieldValues ?? [], // Use optional chaining
            queueNumber: order.queueNumber ?? '', // Use optional chaining
            attendeeCount: order.attendeeCount ?? 0, // Use optional chaining
          },
          registrations: [],
        };
      }
      eventMap[eventId].registrations.push({
        queueNumber: order.queueNumber ?? '', // Use optional chaining
        name: order.customFieldValues?.find((field: { label: string, value: string }) => field.label.toLowerCase().includes('name'))?.value || 'Unknown',
      });
    });

    return Object.values(eventMap);
  } catch (error) {
    console.error('Error in getRegistrationsByUser:', error);
    throw new Error('Failed to fetch registrations');
  }
};
