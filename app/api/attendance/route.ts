import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import Order from '@/lib/database/models/order.model'
import { withAuth } from '@/middleware/auth'

async function handler(req: NextRequest) {
  try {
    await connectToDatabase()
    const { userId, eventId, attended } = await req.json()

    const order = await Order.findOne({ buyer: userId, event: eventId })
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    order.attendance = attended
    await order.save()

    return NextResponse.json({ message: 'Attendance updated', order })
  } catch (error) {
    return NextResponse.json({ message: 'Error updating attendance', error }, { status: 500 })
  }
}

export const POST = (req: NextRequest) => withAuth(req, ['superadmin', 'admin'], handler);