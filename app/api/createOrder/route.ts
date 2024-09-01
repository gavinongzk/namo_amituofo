import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/actions/order.actions';
import { CreateOrderParams } from '@/types';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const order: CreateOrderParams = await req.json();
    const newOrder = await createOrder(order);
    return NextResponse.json(newOrder, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export function OPTIONS() {
  return NextResponse.json({ status: 'OK' }, { status: 200 });
}