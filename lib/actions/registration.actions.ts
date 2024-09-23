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

    const registrations: IRegistration[] = orders.map(order => ({
      event: {
        _id: order.event._id.toString(),
        title: order.event.title,
        imageUrl: order.event.imageUrl, // Add this line
        organizer: order.event.organizer, // Add this line
      },
      registrations: [{
        queueNumber: order.queueNumber,
        name: order.customFieldValues.find((field: { label: string, value: string }) => field.label.toLowerCase().includes('name'))?.value || 'Unknown',
      }]
    }));

    return registrations;
  } catch (error) {
    console.error('Error in getRegistrationsByUser:', error);
    throw new Error('Failed to fetch registrations');
  }
};
