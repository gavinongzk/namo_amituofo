'use server'

import { unstable_cache } from 'next/cache';
import { getAllEvents } from './event.actions';
import { IEvent } from '@/lib/database/models/event.model';

export const preloadEvents = unstable_cache(
  async (country: string) => {
    console.log('🔍 Starting preloadEvents with country:', country);
    
    try {
      console.log('📡 Fetching events from getAllEvents');
      const events = await getAllEvents({
        query: '',
        category: '',
        page: 1,
        limit: 6,
        country: country || 'Singapore'
      });
      
      if (!events || !events.data) {
        console.log('⚠️ No events or events.data found, returning empty result');
        return {
          data: [],
          totalPages: 0
        };
      }

      const currentDate = new Date();
      const fiveDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 5));
      
      const filteredData = events.data.filter((event: IEvent) => {
        const eventEndDate = new Date(event.endDateTime);
        return eventEndDate >= fiveDaysAgo;
      });

      const result = {
        data: filteredData,
        totalPages: events.totalPages
      };

      return result;
      
    } catch (error) {
      console.error('❌ Error in preloadEvents:', error);
      return {
        data: [],
        totalPages: 0
      };
    }
  },
  ['events-preload'],
  {
    revalidate: 300,
    tags: ['events']
  }
); 