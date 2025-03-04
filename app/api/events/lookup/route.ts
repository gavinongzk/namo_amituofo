import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import { NextRequest } from 'next/server'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const date = searchParams.get('date')
    const title = decodeURIComponent(searchParams.get('title') || '')

    if (!category || !date || !title) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Convert the date string to a Date object for the start of the day
    const searchDate = new Date(date)
    const nextDay = new Date(searchDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const event = await Event.findOne({
      'category.name': decodeURIComponent(category),
      startDateTime: {
        $gte: searchDate,
        $lt: nextDay
      },
      title: new RegExp(title.replace(/-/g, '.*'), 'i')
    }).select('_id')

    if (!event) {
      return Response.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return Response.json({ eventId: event._id })
  } catch (error) {
    console.error('Error in event lookup:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 