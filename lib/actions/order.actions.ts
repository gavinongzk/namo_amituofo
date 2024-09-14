"use server"

import { CheckoutOrderParams, CreateOrderParams, GetOrdersByEventParams, GetOrdersByUserParams } from "@/types"
import { handleError } from '../utils';
import { connectToDatabase } from '../database';
import Order from '../database/models/order.model';
import Event from '../database/models/event.model';
import {ObjectId} from 'mongodb';
import User from '../database/models/user.model';

export const createOrder = async (order: CreateOrderParams, userId: string) => {
  try {
    await connectToDatabase();
    
    if (!ObjectId.isValid(order.eventId)) {
      throw new Error('Invalid eventId');
    }

    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid userId');
    }

    const event = await Event.findById(order.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const currentRegistrations = await Order.countDocuments({ event: order.eventId });
    if (currentRegistrations >= event.maxSeats) {
      throw new Error('Event is fully booked');
    }

    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    const lastQueueNumber = lastOrder && lastOrder.queueNumber ? parseInt(lastOrder.queueNumber.slice(1)) : 0;
    const newQueueNumber = `A${(lastQueueNumber + 1).toString().padStart(3, '0')}`;

    const newOrder = await Order.create({
      ...order,
      event: new ObjectId(order.eventId), // Ensure eventId is an ObjectId
      buyer: new ObjectId(userId), // Convert buyerId to ObjectId
      customFieldValues: order.customFieldValues,
      queueNumber: newQueueNumber,
    });

    // Optionally update attendeeCount in Event
    // event.attendeeCount = currentRegistrations + 1;
    // await event.save();

    return { success: true, message: 'User successfully registered', order: newOrder };
  } catch (error) {
    handleError(error);
    return { success: false, message: 'Registration failed' };
  }
}

// GET ORDERS BY EVENT
export async function getOrdersByEvent({ searchString, eventId }: GetOrdersByEventParams) {
  try {
    await connectToDatabase();

    if (!eventId) throw new Error('Event ID is required');
    const eventObjectId = new ObjectId(eventId);

    const orders = await Order.find({ event: eventObjectId })
      .populate('buyer', 'firstName lastName')
      .populate('event', 'title')
      .select('_id createdAt event buyer customFieldValues queueNumber attendance');

    const formattedOrders = orders.map(order => ({
      _id: order._id.toString(),
      createdAt: order.createdAt,
      eventTitle: order.event.title,
      eventId: order.event._id.toString(),
      buyer: `${order.buyer.firstName} ${order.buyer.lastName}`,
      customFieldValues: order.customFieldValues,
      queueNumber: order.queueNumber,
      attendance: order.attendance
    }));

    return JSON.parse(JSON.stringify(formattedOrders));
  } catch (error) {
    handleError(error);
  }
}

// GET ORDERS BY USER
export async function getOrdersByUser({ userId, limit = 3, page }: GetOrdersByUserParams) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;
    const conditions = { buyer: userId };

    const orders = await Order.distinct('event._id')
      .find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: 'event',
        model: Event,
        populate: {
          path: 'organizer',
          model: User,
          select: '_id firstName lastName',
        },
      });

    const ordersCount = await Order.distinct('event').countDocuments(conditions);

    return { data: JSON.parse(JSON.stringify(orders)), totalPages: Math.ceil(ordersCount / limit) };
  } catch (error) {
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

    const eventObjectId = new ObjectId(eventId);
    const orderCount = await Order.countDocuments({ event: eventObjectId });

    return orderCount;
  } catch (error) {
    handleError(error);
  }
}

