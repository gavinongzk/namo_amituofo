import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import Order from '@/lib/database/models/order.model'
import { withAuth } from '@/middleware/auth'

async function handler(req: NextRequest) {
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

export const POST = (req: NextRequest) => withAuth(req, ['superadmin', 'admin'], handler);