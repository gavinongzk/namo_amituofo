import { Metadata } from 'next';
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
    finalImageUrl = `${siteUrl}/assets/images/placeholder.png`; // Default fallback image
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
          // width: 1200,
          // height: 630,
        }
      ],
    },
  };
}

export default async function EventDetailsPage({ params: { id } }: { params: { id: string } }) {
  const event = await getEventById(id);
  
  return <EventDetails event={event} />;
}
