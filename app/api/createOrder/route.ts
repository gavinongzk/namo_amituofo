import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/actions/order.actions';
import { CreateOrderParams, CustomFieldGroup } from '@/types';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  console.log("Received POST request to /api/createOrder");
  const user = await currentUser();
  const userId = user?.publicMetadata.userId as string;

  if (!userId) {
    console.log("Unauthorized: No user ID found");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);
    const { eventId, customFieldValues }: CreateOrderParams = body;

    if (!eventId) {
      return new NextResponse("Event ID is required", { status: 400 });
    }

    const newOrder = await createOrder({
      eventId,
      buyerId: userId,
      createdAt: new Date(),
      customFieldValues: customFieldValues.map((group: CustomFieldGroup) => ({
        groupId: group.groupId,
        fields: group.fields.map((field) => ({
          id: field.id,
          label: field.label,
          type: field.type,
          value: field.value
        }))
      }))
    });

    return NextResponse.json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return new NextResponse(`Error creating order: ${(error as Error).message}`, { status: 500 });
  }
}

export function OPTIONS() {
  return NextResponse.json({ status: 'OK' }, { status: 200 });
}