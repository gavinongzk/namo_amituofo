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
export async function getOrdersByEvent({ searchString, eventId }: GetOrdersByEventParams) {
  try {
    await connectToDatabase();

    if (!eventId) throw new Error('Event ID is required');
    const eventObjectId = new ObjectId(eventId);

    console.log('Fetching orders for event:', eventId);

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

    console.log('Query:', JSON.stringify(query));

    const orders = await Order.find(query)
      .populate('event', 'title imageUrl startDateTime endDateTime')
      .lean();

    console.log('Found orders:', orders.length);

    const formattedOrders: IOrderItem[] = orders.map((order: any) => ({
      _id: order._id.toString(),
      createdAt: order.createdAt,
      event: {
        _id: order.event._id.toString(),
        title: order.event.title,
        imageUrl: order.event.imageUrl,
        startDateTime: order.event.startDateTime,
        endDateTime: order.event.endDateTime,
      },
      customFieldValues: order.customFieldValues.map((field: any) => ({
        groupId: field.groupId,
        queueNumber: field.queueNumber,
        fields: field.fields,
        attendance: field.attendance || false,
        cancelled: field.cancelled || false,
        __v: field.__v || 0,
      })),
      __v: order.__v,
    }));

    console.log('Formatted orders:', formattedOrders.length);

    return formattedOrders;
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

    const orders = await Order.find({ event: eventId });
    const attendeeCount = orders.reduce((count, order) => {
      return count + order.customFieldValues.filter((group: { attendance: boolean }) => group.attendance).length;
    }, 0);

    return attendeeCount;
  } catch (error) {
    console.error('Error fetching attendee count:', error);
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
    console.log('Connected to database, searching for phone number:', phoneNumber);

    const orders = await Order.find({
      'customFieldValues': {
        $elemMatch: {
          'fields': {
            $elemMatch: {
              $or: [
                { type: 'phone', value: phoneNumber },
                { label: { $regex: /contact number/i }, value: phoneNumber }
              ]
            }
          },
          'cancelled': { $ne: true }
        }
      }
    }).populate('event', 'title imageUrl startDateTime endDateTime');

    console.log('Found orders:', orders);

    const serializedOrders = JSON.parse(JSON.stringify(orders));
    console.log('Serialized orders:', serializedOrders);

    return serializedOrders;
  } catch (error) {
    console.error('Error in getOrdersByPhoneNumber:', error);
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
