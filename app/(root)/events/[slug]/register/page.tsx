import { Suspense } from 'react'
import Loading from '@/components/shared/Loader'
import { getEventById } from '@/lib/actions/event.actions'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import dynamic from 'next/dynamic'
import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import Category from '@/lib/database/models/category.model'
import User from '@/lib/database/models/user.model'
import Order from '@/lib/database/models/order.model'

// Dynamically import heavy components
const RegisterFormWrapper = dynamic(() => 
  import('@/components/shared/RegisterFormWrapper'),
  { 
    loading: () => <RegisterPageSkeleton />,
    ssr: true
  }
)

// Cache event data by slug
const getCachedEventBySlug = unstable_cache(
  async (slug: string) => {
    try {
      await connectToDatabase()
      
      const event = await Event.findOne({ slug, isDeleted: { $ne: true } })
        .populate({ path: 'organizer', model: User, select: '_id' })
        .populate({ path: 'category', model: Category, select: '_id name' });

      if (!event) {
        throw new Error('Event not found');
      }

      const attendeeCount = await Order.countDocuments({ event: event._id });

      return {
        ...JSON.parse(JSON.stringify(event)),
        attendeeCount,
      };
    } catch (error) {
      console.error('Error fetching event by slug:', error);
      return null;
    }
  },
  ['event-by-slug'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['events', 'event-images']
  }
)

// Separate loading component for better UX
const RegisterPageSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-24 md:h-32 bg-gray-200 rounded-md mb-2 md:mb-4" />
    <div className="space-y-2 md:space-y-3">
      <div className="h-3 md:h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
)

export async function generateMetadata({ 
  params: { slug } 
}: { 
  params: { slug: string } 
}) {
  const event = await getCachedEventBySlug(slug)
  
  return {
    title: `Register for ${event?.title || 'Event'}`,
    description: `Register for ${event?.title}. ${event?.description?.slice(0, 100)}...`,
  }
}

export default async function EventRegisterPage({ 
  params: { slug },
  searchParams
}: { 
  params: { slug: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const event = await getCachedEventBySlug(slug)
  
  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Event Not Found</h1>
        <p className="text-gray-600 mb-6">Sorry, the event you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }
  
  // Get header to detect client info
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)

  return (
    <div className="flex flex-col md:flex-row gap-10 bg-gray-50 min-h-screen">
      <div className="md:w-2/5 lg:w-1/3 md:sticky md:top-0 md:h-screen bg-primary-50 py-10 px-4 md:px-8 flex items-center">
        <div className="w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
          <p className="text-gray-600 mb-6">{event.description?.substring(0, 150)}...</p>
        </div>
      </div>
      
      <div className="md:w-3/5 lg:w-2/3 py-10 px-4 md:px-8">
        <Suspense fallback={<Loading />}>
          <RegisterFormWrapper event={event} />
        </Suspense>
      </div>
    </div>
  )
} 