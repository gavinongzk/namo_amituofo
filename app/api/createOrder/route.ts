import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/actions/order.actions';
import { CreateOrderParams } from '@/types';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const userId = user?.publicMetadata.userId as string;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const order: CreateOrderParams = await req.json();
    if (!Array.isArray(order.customFieldValues)) {
      throw new Error('customFieldValues must be an array');
    }
    const newOrder = await createOrder(order, userId);
    return NextResponse.json(newOrder, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export function OPTIONS() {
  return NextResponse.json({ status: 'OK' }, { status: 200 });
}