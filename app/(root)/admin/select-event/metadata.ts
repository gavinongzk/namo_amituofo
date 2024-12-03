import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: 'Select Event',
    description: 'Select an event to manage',
    alternates: {
      canonical: '/admin/select-event'
    },
    openGraph: {
      title: 'Select Event',
      description: 'Select an event to manage',
      type: 'website',
    }
  }
} 