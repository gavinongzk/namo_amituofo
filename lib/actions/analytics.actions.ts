'use server'

import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import Order from '@/lib/database/models/order.model'

export const getAnalyticsData = unstable_cache(
  async () => {
    // Use MongoDB aggregation for better performance
    const [attendeeStats, categoryStats, regionStats] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: { name: '$name', phone: '$phoneNumber' },
            eventCount: { $sum: 1 },
            lastEventDate: { $max: '$eventId.date' },
            events: {
              $push: {
                eventDate: '$eventId.date',
                eventTitle: '$eventId.title',
                category: '$eventId.category'
              }
            }
          }
        }
      ]),
      
      Order.aggregate([
        {
          $group: {
            _id: '$eventId.category.name',
            attendeeCount: { $sum: 1 }
          }
        },
        { $sort: { attendeeCount: -1 } },
        { $limit: 5 }
      ]),
      
      Order.aggregate([
        {
          $group: {
            _id: '$region',
            attendeeCount: { $sum: 1 }
          }
        }
      ])
    ])

    return {
      attendees: attendeeStats,
      popularEvents: categoryStats,
      regionDistribution: regionStats
    }
  },
  ['analytics-data'],
  {
    revalidate: 3600, // Revalidate every hour
    tags: ['analytics']
  }
)

// Function to manually revalidate cache
export async function revalidateAnalytics() {
  revalidatePath('/admin/analytics', 'page')
} 