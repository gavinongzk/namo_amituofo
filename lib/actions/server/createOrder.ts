import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { CreateOrderParams } from '@/types';
import { ObjectId } from 'mongodb';

export const createOrder = async (order: CreateOrderParams) => {
  try {
    await connectToDatabase();

    const newOrder = await Order.create({
      ...order,
      event: new ObjectId(order.eventId),
      buyer: new ObjectId(order.buyerId), // Convert buyerId to ObjectId
      customFieldValues: order.customFieldValues,
    });

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error: any) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
};