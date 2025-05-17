// app/(root)/events/details/[id]/register/page.tsx
import { Suspense } from 'react'
import Loading from '@/components/shared/Loader'
import { getEventById } from '@/lib/actions/event.actions'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import dynamic from 'next/dynamic'
import { Metadata } from 'next';
import mongoose from 'mongoose'; // Added for ObjectId validation


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
      <section className="bg-primary-50 bg-dotted-pattern md:bg-dotted-pattern bg-cover bg-center py-1 md:py-4">
        <h3 className="wrapper h3-bold text-center sm:text-left text-lg md:text-2xl px-2 md:px-4">
          活动报名 / Event Registration
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


// Generate metadata for social sharing
export async function generateMetadata({
  params
}: {
  params: {
    id: string
  }
}): Promise<Metadata> {
  console.log('[page.tsx generateMetadata] Received params:', params); // Added log
  // Validate ObjectId format before calling getEventById
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found or the ID is invalid.'
    };
  }

  const event = await getEventById(params.id);

  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.'
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://reg.plb-sea.org'; // IMPORTANT: Ensure NEXT_PUBLIC_SERVER_URL is correctly set in your environment (e.g., https://yourdomain.com)

  let finalImageUrl: string;

  if (event.imageUrl && event.imageUrl.trim() !== '') {
    if (event.imageUrl.startsWith('http')) {
      finalImageUrl = event.imageUrl;
    } else {
      // Assumes relative URLs (e.g., from a CMS or local uploads) start with a '/'
      finalImageUrl = `${siteUrl}${event.imageUrl.startsWith('/') ? event.imageUrl : `/${event.imageUrl}`}`;
    }
  } else {
    finalImageUrl = `${siteUrl}/assets/images/logo.svg`; // Default fallback image
  }
 
  return {
    title: `${event.title} | Namo Amituofo`,
    description: event.description || 'Join us for this special event',
    openGraph: {
      title: event.title,
      description: event.description || 'Join us for this special event',
      images: [
        {
          url: finalImageUrl,
          alt: event.title,
          // For optimal display, WhatsApp and other platforms prefer images around 1200x630 pixels.
          // Consider adding width and height if your images (including the placeholder) have consistent dimensions:
          width: 1200,
          height: 630,
        }
      ],
    },
  };
}
