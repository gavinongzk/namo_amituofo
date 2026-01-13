import { NextRequest, NextResponse } from 'next/server'
import { getEventsForSelection } from '@/lib/actions/event.actions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'Singapore'

    // Public endpoint: do NOT depend on Clerk.
    // Role omitted => treated as regular user (no drafts, normal expiration filtering).
    const events = await getEventsForSelection({ country, role: undefined })

    return new NextResponse(JSON.stringify({ data: events }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    })
  } catch (error) {
    console.error('Error fetching public events for selection:', error)
    return NextResponse.json({ message: 'Failed to fetch events', data: [] }, { status: 500 })
  }
}


