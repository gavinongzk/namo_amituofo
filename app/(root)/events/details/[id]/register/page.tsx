// app/(root)/events/details/[id]/register/page.tsx
import { Suspense } from 'react'
import Loading from '@/components/shared/Loader'
import { getEventById } from '@/lib/actions/event.actions'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import dynamic from 'next/dynamic'
import { Metadata } from 'next';
import mongoose from 'mongoose'; // Added for ObjectId validation
import { currentUser } from '@clerk/nextjs'

// Implement ISR (Incremental Static Regeneration)
export const revalidate = 300; // Revalidate every 5 minutes

// Dynamically import heavy components
const RegisterFormWrapper = dynamic(() => 
  import('@/components/shared/RegisterFormWrapper'),
  { 
    loading: () => <RegisterPageSkeleton />,
    ssr: true
  }
)

// Cache event data with better optimization
const getCachedEvent = unstable_cache(
  async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return getEventById(id);
  },
  ['event-registration'],
  { 
    revalidate: 300,
    tags: ['event-details', 'registration']
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
  params 
}: { 
  params: { id: string } 
}) {
  const user = await currentUser();
  
  // Create a promise for the event data
  const eventPromise = getCachedEvent(params.id);

  return (
    <div className="wrapper my-8">
      <Suspense fallback={<Loading />}>
        <AsyncRegisterForm eventPromise={eventPromise} user={user} />
      </Suspense>
    </div>
  )
}

async function AsyncRegisterForm({ 
  eventPromise,
  user
}: { 
  eventPromise: Promise<any>
  user: any
}) {
  const event = await eventPromise;

  if (!event) {
    return (
      <div className="text-center py-10">
        <h3 className="text-2xl font-bold text-gray-900">活动未找到 / Event Not Found</h3>
        <p className="mt-2 text-gray-600">抱歉，找不到该活动。/ Sorry, this event could not be found.</p>
      </div>
    )
  }

  // Block registration for draft events unless viewer is superadmin
  if (event.isDraft) {
    const role = user?.publicMetadata?.role as string | undefined;
    if (role !== 'superadmin') {
      return (
        <div className="text-center py-10">
          <h3 className="text-2xl font-bold text-gray-900">暂未开放 / Not Available</h3>
          <p className="mt-2 text-gray-600">此活动尚未发布。/ This event has not been published yet.</p>
        </div>
      )
    }
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
      url: `${siteUrl}/events/details/${params.id}/register`,
      siteName: 'Namo Amituofo',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: finalImageUrl,
          secureUrl: finalImageUrl,
          type: 'image/jpeg',
          alt: event.title,
          width: 1200,
          height: 630,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description || 'Join us for this special event',
      images: [finalImageUrl],
    },
  };
}
