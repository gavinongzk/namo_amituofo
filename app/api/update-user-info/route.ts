import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { orderId, updatedFields } = await req.json();

        if (!orderId || !updatedFields) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderId },
            updatedFields,
            { new: true }
        );

        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Order info updated successfully', order });
    } catch (error) {
        console.error('Error updating order info:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
