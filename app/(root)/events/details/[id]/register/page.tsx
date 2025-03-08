// app/(root)/events/details/[id]/register/page.tsx
import { Suspense } from 'react'
import Loading from '@/components/shared/Loader'
import { getEventById } from '@/lib/actions/event.actions'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import dynamic from 'next/dynamic'
import { Metadata } from 'next'

// Dynamically import heavy components
const RegisterFormWrapper = dynamic(() => 
  import('@/components/shared/RegisterFormWrapper'),
  { 
    loading: () => <RegisterPageSkeleton />,
    ssr: true
  }
)

// Optimize caching strategy
const getCachedEvent = unstable_cache(
  async (id: string) => getEventById(id),
  ['event-registration'],
  { 
    revalidate: 60, // Reduce revalidation time for more frequent updates
    tags: ['event-details', 'registration'],
  }
)

// Prefetch data for linked events
const prefetchLinkedEvents = async (eventId: string) => {
  try {
    const event = await getCachedEvent(eventId)
    if (event?.relatedEvents) {
      event.relatedEvents.forEach((id: string) => {
        getCachedEvent(id) // Prefetch related events
      })
    }
  } catch (error) {
    console.error('Error prefetching events:', error)
  }
}

// Improved loading skeleton with more realistic appearance
const RegisterPageSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-24 md:h-32 bg-gray-200 rounded-md" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
)

export default async function RegisterPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  // Start data fetch and prefetching immediately
  const eventPromise = getCachedEvent(id)
  prefetchLinkedEvents(id) // Prefetch in parallel

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern md:bg-dotted-pattern bg-cover bg-center py-1 md:py-4">
        <h3 className="wrapper h3-bold text-center sm:text-left text-lg md:text-2xl px-2 md:px-4">
          活动报名 / Register for Event
        </h3>
      </section>

      <div className="wrapper my-1 md:my-4">
        <Suspense fallback={<RegisterPageSkeleton />}>
          <AsyncRegisterForm eventPromise={eventPromise} />
        </Suspense>
      </div>
    </>
  )
}

// Separate async component to handle event data
async function AsyncRegisterForm({ 
  eventPromise 
}: { 
  eventPromise: Promise<any> 
}) {
  const event = await eventPromise

  if (!event) {
    return (
      <div className="text-center py-10">
        <h3 className="text-2xl font-bold text-gray-900">
          未找到活动 / Event not found
        </h3>
        <p className="mt-2 text-gray-600">
          您要查找的活动不存在或已被删除。/ The event you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return <RegisterFormWrapper event={event} />
}

// Optimize metadata generation
export async function generateMetadata({ 
  params: { id } 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  const event = await getCachedEvent(id)
  
  return {
    title: `Register for ${event?.title || 'Event'}`,
    description: `Register for ${event?.title}. ${event?.description?.slice(0, 100)}...`,
    openGraph: {
      title: `Register for ${event?.title || 'Event'}`,
      description: `Register for ${event?.title}. ${event?.description?.slice(0, 100)}...`,
      type: 'website',
    },
  }
}