import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { CreateOrderParams } from '@/types';
import { ObjectId } from 'mongodb';
import { currentUser } from '@clerk/nextjs'

export const createOrder = async (order: CreateOrderParams) => {
  try {
    await connectToDatabase();

    const user = await currentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }
    const userId = user?.publicMetadata.userId as string;

    const newOrder = await Order.create({
      ...order,
      event: new ObjectId(order.eventId),
      buyer: new ObjectId(userId), // Convert buyerId to ObjectId
      customFieldValues: order.customFieldValues,
    });

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error: any) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
};