import { IRegistration } from '@/types';
import { connectToDatabase } from '../database';
import Order from '../database/models/order.model';
import Event from '../database/models/event.model';
import User from '../database/models/user.model';

export const getRegistrationsByUser = async (userId: string): Promise<IRegistration[]> => {
  try {
    await connectToDatabase();

    const orders = await Order.find({ buyer: userId })
      .populate('event', 'title')
      .populate('buyer', 'firstName lastName')
      .exec();

    const registrationsMap: { [eventId: string]: IRegistration } = {};

    orders.forEach(order => {
      const eventId = order.event._id.toString();
      if (!registrationsMap[eventId]) {
        registrationsMap[eventId] = {
          eventId,
          eventTitle: order.event.title,
          registrations: []
        };
      }
      registrationsMap[eventId].registrations.push({
        queueNumber: order.queueNumber,
        name: `${order.buyer.firstName} ${order.buyer.lastName}`
      });
    });

    return Object.values(registrationsMap);
  } catch (error) {
    console.error('Error in getRegistrationsByUser:', error);
    throw new Error('Failed to fetch registrations');
  }
};
