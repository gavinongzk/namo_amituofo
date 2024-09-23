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
      .exec();

    const registrationsMap: { [eventId: string]: IRegistration } = {};

    orders.forEach(order => {
      const eventId = order.event._id.toString();
      if (!registrationsMap[eventId]) {
        registrationsMap[eventId] = {
          eventId,
          event: order.event, // Use the existing event property
          registrations: []
        };
      }
      const nameField = order.customFieldValues.find((field: { label: string, value: string }) => field.label.toLowerCase().includes('name'));
      const name = nameField ? nameField.value : 'Unknown';
      registrationsMap[eventId].registrations.push({
        queueNumber: order.queueNumber,
        name
      });
    });

    return Object.values(registrationsMap);
  } catch (error) {
    console.error('Error in getRegistrationsByUser:', error);
    throw new Error('Failed to fetch registrations');
  }
};
