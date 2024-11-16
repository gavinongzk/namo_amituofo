'use server'

import { unstable_cache } from 'next/cache';
import { getAllEvents } from './event.actions';

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
      
      console.log('📦 Raw events response:', JSON.stringify(events, null, 2));
      
      if (!events || !events.data) {
        console.log('⚠️ No events or events.data found, returning empty result');
        return {
          data: [],
          totalPages: 0
        };
      }

      const currentDate = new Date();
      const fiveDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 5));
      
      console.log('📅 Filtering events after:', fiveDaysAgo);
      
      const filteredData = events.data.filter(event => {
        const eventEndDate = new Date(event.endDateTime);
        console.log(`🎯 Checking event ${event._id}:`, {
          endDateTime: event.endDateTime,
          isAfterFiveDays: eventEndDate >= fiveDaysAgo
        });
        return eventEndDate >= fiveDaysAgo;
      });

      const result = {
        data: filteredData,
        totalPages: events.totalPages
      };

      console.log('✅ Returning filtered result:', JSON.stringify(result, null, 2));
      return result;
      
    } catch (error) {
      console.error('❌ Error in preloadEvents:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
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