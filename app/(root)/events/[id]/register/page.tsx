// app/(root)/events/[id]/register/page.tsx
import { Suspense } from 'react'
import Loading from '@/components/shared/Loader'
import RegisterForm from '@/components/shared/RegisterForm'
import { getEventById } from '@/lib/actions/event.actions'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'

// Cache the event data
const getCachedEvent = unstable_cache(
  async (id: string) => getEventById(id),
  ['event-registration'],
  { revalidate: 60 } // Cache for 1 minute
)

// Separate loading component for better UX
const RegisterPageSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-32 bg-gray-200 rounded-md mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
)

export default async function RegisterPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  // Start fetching event data immediately
  const eventPromise = getCachedEvent(id)

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">
          Register for Event
        </h3>
      </section>

      <div className="wrapper my-8">
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
          Event not found
        </h3>
        <p className="mt-2 text-gray-600">
          The event you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return <RegisterForm event={event} />
}

// Generate static params for common event IDs
export function generateStaticParams() {
  // Add your most common event IDs here
  return [
    { id: 'popular-event-1' },
    { id: 'popular-event-2' },
  ]
}

export async function generateMetadata({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  const event = await getCachedEvent(id)
  
  return {
    title: `Register for ${event?.title || 'Event'}`,
    description: `Register for ${event?.title}. ${event?.description?.slice(0, 100)}...`,
  }
}