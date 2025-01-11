import { IRegistration } from '@/types';
import { connectToDatabase } from '../database';
import Order from '../database/models/order.model';
import Event from '../database/models/event.model';
import User from '../database/models/user.model';
import { CustomFieldGroup } from '@/types';


export const getRegistrationsByUser = async (userId: string): Promise<IRegistration[]> => {
  try {
    await connectToDatabase();

    const currentDate = new Date();
    const orders = await Order.find({ buyer: userId })
      .populate({
        path: 'event',
        select: '_id title imageUrl organizer attendeeCount endDateTime startDateTime category',
        populate: [
          {
            path: 'organizer',
            select: '_id',
          },
          {
            path: 'category',
            select: '_id name',
          }
        ],
      })
      .exec();

    const eventMap: { [key: string]: IRegistration } = {};

    orders.forEach(order => {
      const eventId = order.event._id.toString();
      if (new Date(order.event.endDateTime) >= currentDate) { // Filter out past events
        if (!eventMap[eventId]) {
          eventMap[eventId] = {
            event: {
              _id: eventId,
              title: order.event.title,
              imageUrl: order.event.imageUrl,
              organizer: order.event.organizer,
              orderId: order._id?.toString(),
              customFieldValues: order.customFieldValues,
              attendeeCount: order.event.attendeeCount ?? 0,
              startDateTime: order.event.startDateTime,
              endDateTime: order.event.endDateTime,
              category: order.event.category,
            },
            registrations: [],
          };
        }
        order.customFieldValues.forEach((group: CustomFieldGroup) => {
          const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));
          eventMap[eventId].registrations.push({
            queueNumber: group.queueNumber,
            name: nameField && typeof nameField.value === 'string' ? nameField.value : 'Unknown',
          });
        });
      }
    });

    return Object.values(eventMap);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    throw new Error('Error fetching registrations');
  }
};
