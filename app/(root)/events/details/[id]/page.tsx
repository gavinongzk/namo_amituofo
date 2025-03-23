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

  return {
    title: `${event.title} | Namo Amituofo`,
    description: event.description || 'Join us for this special event',
    openGraph: {
      title: event.title,
      description: event.description || 'Join us for this special event',
      images: [event.imageUrl],
    },
  };
}

export default async function EventDetailsPage({ params: { id } }: { params: { id: string } }) {
  const event = await getEventById(id);
  
  return <EventDetails event={event} />;
}
