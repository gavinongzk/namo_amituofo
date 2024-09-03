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

    const newOrder = await Order.create({
      ...order,
      event: new ObjectId(order.eventId), // Ensure eventId is an ObjectId
      buyer: new ObjectId(userId), // Convert buyerId to ObjectId
      customFieldValues: order.customFieldValues,
    });

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error) {
    handleError(error);
  }
}

// GET ORDERS BY EVENT
export async function getOrdersByEvent({ searchString, eventId }: GetOrdersByEventParams) {
  try {
    await connectToDatabase();

    if (!eventId) throw new Error('Event ID is required');
    const eventObjectId = new ObjectId(eventId);

    console.log("Event ID:", eventId); // Debugging log
    console.log("Search String:", searchString); // Debugging log

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyer',
        },
      },
      {
        $unwind: '$buyer',
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: '$event',
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          eventTitle: '$event.title',
          eventId: '$event',
          buyer: {
            $concat: ['$buyer'],
          },
          customFieldValues: 1,
        },
      },
      {
        $match: {
          $and: [{ event: eventObjectId }],
        },
      },
    ]);

    console.log("Orders Found:", orders); // Debugging log

    return JSON.parse(JSON.stringify(orders));
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