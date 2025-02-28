'use server'

import { unstable_cache } from 'next/cache';
import { getAllEvents } from './event.actions';
import { IEvent } from '@/lib/database/models/event.model';
import { EVENT_CONFIG } from '@/lib/config/event.config';
import { getAllCategories } from './category.actions';

// Cache events by category
export const preloadEventsByCategory = unstable_cache(
  async (country: string, category: string) => {
    console.log('🔍 Starting preloadEventsByCategory with:', { country, category });
    
    try {
      const events = await getAllEvents({
        query: '',
        category,
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

      const expirationDate = EVENT_CONFIG.getExpirationDate();
      const filteredData = events.data.filter((event: IEvent) => {
        const eventEndDate = new Date(event.endDateTime);
        return eventEndDate >= expirationDate;
      });

      return {
        data: filteredData,
        totalPages: events.totalPages
      };
      
    } catch (error) {
      console.error('❌ Error in preloadEventsByCategory:', error);
      return {
        data: [],
        totalPages: 0
      };
    }
  },
  ['events-by-category'],
  {
    revalidate: 300, // Shorter cache time for filtered results
    tags: ['events']
  }
);

// Preload all categories
export const preloadCategories = unstable_cache(
  async () => {
    try {
      return await getAllCategories();
    } catch (error) {
      console.error('❌ Error in preloadCategories:', error);
      return [];
    }
  },
  ['categories'],
  {
    revalidate: 3600,
    tags: ['categories']
  }
);

// Main preload function
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

      const expirationDate = EVENT_CONFIG.getExpirationDate();
      
      console.log('📅 Filtering events after:', expirationDate);
      
      const filteredData = events.data.filter((event: IEvent) => {
        const eventEndDate = new Date(event.endDateTime);
        console.log(`🎯 Checking event ${event._id}:`, {
          endDateTime: event.endDateTime,
          isAfterExpiration: eventEndDate >= expirationDate
        });
        return eventEndDate >= expirationDate;
      });

      // Preload categories in the background
      void preloadCategories();

      // Preload events for common categories
      const categories = await preloadCategories();
      categories.forEach(category => {
        void preloadEventsByCategory(country, category.name);
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