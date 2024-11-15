'use server'

import { unstable_cache } from 'next/cache';
import { getAllEvents } from './event.actions';

export const preloadEvents = unstable_cache(
  async (country: string) => {
    try {
      const events = await getAllEvents({
        query: '',
        category: '',
        page: 1,
        limit: 6,
        country: country || 'Singapore'
      });
      
      if (!events || !events.data) {
        return {
          data: [],
          totalPages: 0
        };
      }

      const currentDate = new Date();
      const fiveDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 5));
      
      return {
        data: events.data.filter(event => new Date(event.endDateTime) >= fiveDaysAgo),
        totalPages: events.totalPages
      };
    } catch (error) {
      console.error('Error preloading events:', error);
      return {
        data: [],
        totalPages: 0
      };
    }
  },
  ['events-preload'],
  {
    revalidate: 3600,
    tags: ['events']
  }
); 