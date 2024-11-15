'use server'

import { unstable_cache } from 'next/cache';
import { getAllEvents } from './event.actions';

export const preloadEvents = unstable_cache(
  async (country: string) => {
    const events = await getAllEvents({
      query: '',
      category: '',
      page: 1,
      limit: 6,
      country
    });
    
    const currentDate = new Date();
    const fiveDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 5));
    
    return {
      data: events.data.filter(event => new Date(event.endDateTime) >= fiveDaysAgo),
      totalPages: events.totalPages
    };
  },
  ['events-preload'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['events']
  }
); 