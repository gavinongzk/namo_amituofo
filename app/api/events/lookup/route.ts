import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return Response.json(
        { error: 'Missing date parameter' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Convert the date string to a Date object for the start of the day
    const searchDate = new Date(date)
    const nextDay = new Date(searchDate)
    nextDay.setDate(nextDay.getDate() + 1)

    console.log('Looking for event on:', searchDate)

    const event = await Event.findOne({
      startDateTime: {
        $gte: searchDate,
        $lt: nextDay
      },
      isDeleted: { $ne: true }
    }).select('_id')

    if (!event) {
      console.log('Event not found')
      return Response.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    console.log('Found event:', event._id)
    return Response.json({ eventId: event._id })
  } catch (error) {
    console.error('Error in event lookup:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 