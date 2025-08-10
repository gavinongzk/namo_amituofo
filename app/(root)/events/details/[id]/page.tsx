import { Metadata } from 'next';
import mongoose from 'mongoose'; // Added for ObjectId validation
import { notFound } from 'next/navigation'; // Added for handling not found pages
import { getEventById } from '@/lib/actions/event.actions';
import { currentUser } from '@clerk/nextjs';
import EventDetails from './EventDetails';

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
    finalImageUrl = `${siteUrl}/assets/images/logo.png`; // Default fallback image - using PNG for better social preview compatibility
  }

  let imageType = 'image/jpeg'; // Default for .jpg/.jpeg
  if (finalImageUrl.endsWith('.png')) {
    imageType = 'image/png';
  } else if (finalImageUrl.endsWith('.svg')) {
    imageType = 'image/svg+xml';
  } else if (finalImageUrl.endsWith('.gif')) {
    imageType = 'image/gif';
  } else if (finalImageUrl.endsWith('.webp')) {
    imageType = 'image/webp';
  }
 
  // Truncate description to 80 characters for optimal WhatsApp preview
  const truncatedDescription = event.description
    ? event.description.length > 80
      ? event.description.substring(0, 77) + '...'
      : event.description
    : 'Join us for this special event';

  return {
    title: event.title,
    description: truncatedDescription,
    openGraph: {
      title: event.title, // Keep title without branding for WhatsApp
      description: truncatedDescription,
      url: `${siteUrl}/events/details/${params.id}`,
      siteName: 'Namo Amituofo',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: finalImageUrl,
          secureUrl: finalImageUrl,
          type: imageType,
          alt: event.title,
          // WhatsApp requires images under 600KB and width >= 300px
          // Current dimensions (1200x630) meet these requirements
          width: 1200,
          height: 630,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: truncatedDescription,
      images: [finalImageUrl],
    },
  };
}

export default async function EventDetailsPage({ params }: { params: { id: string } }) { // Changed to destructure params directly
  console.log('[page.tsx EventDetailsPage] Received params:', params); // Added log
  const { id } = params; // Destructure id from params

  // Validate ObjectId format before calling getEventById
  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound(); // Render a 404 page if the ID format is invalid
  }

  const event = await getEventById(id);

  // If event is still null here (e.g., valid ID format but event doesn't exist),
  // EventDetails component should handle rendering a "not found" state.
  // If getEventById itself throws or returns an unhandled error for a valid ID,
  // Next.js error handling would take over.
  if (!event) {
    // This case handles if getEventById returns null for a valid ID (event genuinely not found)
    notFound();
  }
  // If event is a draft, only superadmins can view it
  if ((event as any).isDraft) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role as string | undefined;
    if (role !== 'superadmin') {
      notFound();
    }
  }
  
  return <EventDetails event={event} />;
}
