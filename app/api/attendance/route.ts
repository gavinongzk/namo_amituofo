import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import Order from '@/lib/database/models/order.model'

export async function POST(req: Request) {
  try {
    await connectToDatabase()
    const { queueNumber } = await req.json()

    const order = await Order.findOne({ queueNumber })
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    order.attendance = true
    await order.save()

    return NextResponse.json({ message: 'Attendance marked', order })
  } catch (error) {
    return NextResponse.json({ message: 'Error marking attendance', error }, { status: 500 })
  }
}