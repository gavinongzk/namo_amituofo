"use server"

import { CreateOrderParams, GetOrdersByEventParams, GetOrdersByUserParams } from "@/types"
import { handleError } from '../utils';
import { connectToDatabase } from '../database';
import Order from '../database/models/order.model';
import Event from '../database/models/event.model';
import {ObjectId} from 'mongodb';
import { IOrder, IOrderItem } from '../database/models/order.model';
import QRCode from 'qrcode';
import { CustomFieldGroup } from '@/types'
import { unstable_cache } from 'next/cache'

export async function createOrder(order: CreateOrderParams) {
  try {
    await connectToDatabase();
    console.log("Connected to database");

    if (!ObjectId.isValid(order.eventId)) {
      console.log("Invalid eventId:", order.eventId);
      throw new Error('Invalid eventId');
    }

    const event = await Event.findById(order.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Count only uncancelled registrations
    const currentRegistrations = await Order.aggregate([
      { $match: { event: new ObjectId(order.eventId) } },
      { $unwind: "$customFieldValues" },
      { $match: { "customFieldValues.cancelled": { $ne: true } } },
      { $count: "total" }
    ]);

    const totalRegistrations = currentRegistrations[0]?.total || 0;

    if (totalRegistrations >= event.maxSeats) {
      throw new Error('Event is fully booked');
    }

    const lastOrder = await Order.findOne({ event: order.eventId }).sort({ createdAt: -1 });
    let lastQueueNumber = 0;
    if (lastOrder) {
      const allQueueNumbers = lastOrder.customFieldValues.map((group: { queueNumber: string }) => 
        parseInt(group.queueNumber.slice(1))
      );
      lastQueueNumber = Math.max(...allQueueNumbers);
    }

    const newCustomFieldValues = await Promise.all(order.customFieldValues.map(async (group, index) => {
      const newQueueNumber = `${(lastQueueNumber + index + 1).toString().padStart(3, '0')}`;
      const qrCodeData = `${order.eventId}_${newQueueNumber}`;
      const qrCode = await QRCode.toDataURL(qrCodeData); // Change to toDataURL
      return {
        ...group,
        queueNumber: newQueueNumber,
        qrCode: qrCode,
        cancelled: false,
        __v: 0,
      };
    }));

    const newOrder = await Order.create({
      ...order,
      event: new ObjectId(order.eventId),
      customFieldValues: newCustomFieldValues,
    });

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// GET ORDERS BY EVENT
export async function getOrdersByEvent({ searchString, eventId, select }: GetOrdersByEventParams) {
  try {
    await connectToDatabase();

    if (!eventId) throw new Error('Event ID is required');
    const eventObjectId = new ObjectId(eventId);

    let query = { event: eventObjectId };

    if (searchString) {
      const lowercasedSearchString = searchString.toLowerCase();
      const queryObject = {
        event: query.event,
        $or: [
          { 'customFieldValues.fields.value': { $regex: lowercasedSearchString, $options: 'i' } },
          { 'customFieldValues.queueNumber': { $regex: lowercasedSearchString, $options: 'i' } }
        ]
      };
      query = queryObject;
    }

    const baseQuery = Order.find(query);
    
    // Handle field selection
    const eventFields = select ? 
      select.split(' ')
        .filter(f => f.startsWith('event.'))
        .map(f => f.replace('event.', ''))
        .join(' ') : 
      'title imageUrl startDateTime endDateTime location';

    const orders = await baseQuery
      .populate({
        path: 'event',
        select: eventFields
      })
      .lean();

    return orders;
  } catch (error) {
    console.error('Error in getOrdersByEvent:', error);
    handleError(error);
  }
}

export const getOrderById = async (orderId: string) => {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId).populate('event').populate('buyer');
    if (!order) throw new Error('Order not found');
    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    handleError(error);
  }
};

export async function getOrderCountByEvent(eventId: string) {
  try {
    await connectToDatabase();

    if (!ObjectId.isValid(eventId)) {
      throw new Error('Invalid eventId');
    }

    // Count total registrations regardless of cancelled status
    // since maxSeats is already adjusted during cancellation
    const orders = await Order.find({ event: eventId });
    const totalRegistrations = orders.reduce((count, order) => {
      return count + order.customFieldValues.length;
    }, 0);

    return totalRegistrations;
  } catch (error) {
    console.error('Error fetching registration count:', error);
    throw error;
  }
}

export async function getTotalRegistrationsByEvent(eventId: string) {
  try {
    await connectToDatabase();

    if (!ObjectId.isValid(eventId)) {
      throw new Error('Invalid eventId');
    }

    const orders = await Order.find({ event: eventId });
    const totalRegistrations = orders.reduce((count, order) => {
      return count + order.customFieldValues.filter((group: { cancelled: boolean }) => !group.cancelled).length;
    }, 0);

    return totalRegistrations;
  } catch (error) {
    console.error('Error fetching total registrations:', error);
    throw error;
  }
}

export const getOrdersByPhoneNumber = async (phoneNumber: string) => {
  try {
    await connectToDatabase();
    
    // Calculate date for 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const orders = await Order.find({
      'customFieldValues': {
        $elemMatch: {
          'fields': {
            $elemMatch: {
              $or: [
                { type: 'phone', value: phoneNumber },
                { label: { $regex: /phone/i }, value: phoneNumber }
              ]
            }
          },
          'cancelled': { $ne: true }
        }
      }
    })
    .populate({
      path: 'event',
      match: { startDateTime: { $gte: twoDaysAgo } },
      select: '_id title imageUrl startDateTime endDateTime organizer category',
      populate: {
        path: 'category',
        select: '_id name'
      }
    });

    // Filter out any null events (those that didn't match the date criteria)
    const filteredOrders = orders.filter(order => order.event);

    return filteredOrders;
  } catch (error) {
    console.error('Error in getOrdersByPhoneNumber:', error);
    throw error;
  }
};

export const getAllOrdersByPhoneNumber = async (phoneNumber: string) => {
  try {
    await connectToDatabase();
    
    const orders = await Order.find({
      'customFieldValues': {
        $elemMatch: {
          'fields': {
            $elemMatch: {
              $or: [
                { type: 'phone', value: phoneNumber },
                { label: { $regex: /phone/i }, value: phoneNumber }
              ]
            }
          },
          'cancelled': { $ne: true }
        }
      }
    })
    .populate({
      path: 'event',
      select: '_id title imageUrl startDateTime endDateTime organizer category',
      populate: {
        path: 'category',
        select: '_id name'
      }
    });

    return orders;
  } catch (error) {
    console.error('Error in getAllOrdersByPhoneNumber:', error);
    throw error;
  }
};

export const getGroupIdsByEventId = async (eventId: string): Promise<string[]> => {
  try {
    await connectToDatabase();

    const orders = await Order.find({ event: eventId }).exec();
    const groupIds = orders.flatMap(order => 
      order.customFieldValues.map( (group: CustomFieldGroup) => group.groupId)
    );

    return groupIds;
  } catch (error) {
    console.error('Error fetching group IDs:', error);
    throw new Error('Failed to fetch group IDs');
  }
};

export const getCachedOrderCount = unstable_cache(
  async (eventId: string) => {
    return getOrderCountByEvent(eventId)
  },
  ['event-order-count'],
  { revalidate: 30 } // Cache for 30 seconds
)
