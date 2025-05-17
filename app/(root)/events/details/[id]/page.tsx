import { Metadata } from 'next';
import mongoose from 'mongoose'; // Added for ObjectId validation
import { notFound } from 'next/navigation'; // Added for handling not found pages
import { getEventById } from '@/lib/actions/event.actions';
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
  
  return <EventDetails event={event} />;
}
