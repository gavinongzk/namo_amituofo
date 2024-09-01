import { NextApiRequest, NextApiResponse } from 'next';
import { createOrder } from '@/lib/actions/order.actions';
import { CreateOrderParams } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const order: CreateOrderParams = req.body;
      const newOrder = await createOrder(order);
      res.status(200).json(newOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}