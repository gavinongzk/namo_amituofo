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

    // Create date objects for start and end of the day in UTC
    const searchDate = new Date(date + 'T00:00:00Z')
    const nextDay = new Date(date + 'T23:59:59.999Z')

    console.log('Looking for event between:', {
      searchDate: searchDate.toISOString(),
      nextDay: nextDay.toISOString()
    })

    // First try to find events starting on this exact date
    let event = await Event.findOne({
      startDateTime: {
        $gte: searchDate,
        $lte: nextDay
      },
      isDeleted: { $ne: true }
    }).select('_id startDateTime')

    if (!event) {
      // If no event found, log all events around this date for debugging
      console.log('No event found on exact date, checking nearby dates...')
      const nearbyEvents = await Event.find({
        startDateTime: {
          $gte: new Date(searchDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
          $lte: new Date(nextDay.getTime() + 7 * 24 * 60 * 60 * 1000)    // 7 days after
        },
        isDeleted: { $ne: true }
      }).select('_id startDateTime')
      
      console.log('Nearby events:', nearbyEvents.map(e => ({
        id: e._id,
        startDateTime: e.startDateTime
      })))
    } else {
      console.log('Found event:', {
        id: event._id,
        startDateTime: event.startDateTime
      })
    }

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