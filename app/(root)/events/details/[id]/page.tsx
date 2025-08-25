import { Metadata } from 'next';
import mongoose from 'mongoose'; // Added for ObjectId validation
import { notFound } from 'next/navigation'; // Added for handling not found pages
import { getEventById } from '@/lib/actions/event.actions';
import { currentUser } from '@clerk/nextjs';
import EventDetails from './EventDetails';

// Implement ISR (Incremental Static Regeneration)
export const revalidate = 300; // Revalidate every 5 minutes

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

export default async function EventDetailsPage({ params }: { params: { id: string } }) {
  console.log('[page.tsx] Received params:', params); // Added log

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    notFound();
  }

  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  const user = await currentUser();

  return <EventDetails event={event} />;
}
