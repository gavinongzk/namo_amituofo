// app/(root)/events/[id]/register/page.tsx
import { Suspense } from 'react'
import Loading from '@/components/shared/Loader'
import { getEventById } from '@/lib/actions/event.actions'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import dynamic from 'next/dynamic'

// Dynamically import heavy components
const RegisterFormWrapper = dynamic(() => 
  import('@/components/shared/RegisterFormWrapper'),
  { 
    loading: () => <RegisterPageSkeleton />,
    ssr: true
  }
)

// Cache event data
const getCachedEvent = unstable_cache(
  async (id: string) => getEventById(id),
  ['event-registration'],
  { 
    revalidate: 300,
    tags: ['event-details']
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

export default async function RegisterPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  // Start data fetch immediately
  const eventPromise = getCachedEvent(id)

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern md:bg-dotted-pattern bg-cover bg-center py-2 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left text-lg md:text-2xl px-2 md:px-4">
          活动报名 / Register for Event
        </h3>
      </section>

      <div className="wrapper my-4 md:my-8">
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
  try {
    const event = await eventPromise
    
    if (!event) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <a href="/events" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            View All Events
          </a>
        </div>
      );
    }
    
    return <RegisterFormWrapper event={event} />
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Event</h1>
        <p className="text-gray-600 mb-6">There was a problem loading this event.</p>
        <a href="/events" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          View All Events
        </a>
      </div>
    );
  }
}

export async function generateMetadata({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  try {
    const event = await getCachedEvent(id)
    
    if (!event) {
      return {
        title: 'Event Not Found',
        description: 'The requested event could not be found.'
      };
    }
    
    return {
      title: `Register for ${event.title}`,
      description: `Register for ${event.title}. ${event.description?.slice(0, 100)}...`,
    }
  } catch (error) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.'
    };
  }
}