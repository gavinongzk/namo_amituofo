'use server'

import { unstable_cache } from 'next/cache';
import { getAllEvents } from './event.actions';
import { IEvent } from '@/lib/database/models/event.model';
import { EVENT_CONFIG } from '@/lib/config/event.config';
import { getAllCategories } from './category.actions';
import { ICategory } from '@/lib/database/models/category.model';

// Cache events by category
export const preloadEventsByCategory = unstable_cache(
  async (country: string, category: string, role?: string) => {
    console.log('🔍 Starting preloadEventsByCategory with:', { country, category, role });
    
    try {
      const events = await getAllEvents({
        query: '',
        category,
        page: 1,
        limit: 6,
        country: country || 'Singapore',
        role
      });
      
      if (!events || !events.data) {
        return {
          data: [],
          totalPages: 0
        };
      }

      const expirationDate = EVENT_CONFIG.getExpirationDate(role);
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
    revalidate: false,
    tags: ['events']
  }
);

// Preload categories with optimized caching
export const preloadCategories = unstable_cache(
  async (includeHidden: boolean = false) => {
    console.log('🔍 Starting preloadCategories');
    
    try {
      const categories = await getAllCategories(includeHidden);
      console.log('✅ Categories preloaded successfully');
      return categories || [];
    } catch (error) {
      console.error('❌ Error in preloadCategories:', error);
      return [];
    }
  },
  ['categories-preload'],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ['categories']
  }
);

// Main preload function
export const preloadEvents = unstable_cache(
  async (country: string, role?: string) => {
    console.log('🔍 Starting preloadEvents with country:', country, 'role:', role);
    
    try {
      console.log('📡 Fetching events from getAllEvents');
      const events = await getAllEvents({
        query: '',
        category: '',
        page: 1,
        limit: 6,
        country: country || 'Singapore',
        role
      });
      
      console.log('📦 Raw events response:', JSON.stringify(events, null, 2));
      
      if (!events || !events.data) {
        console.log('⚠️ No events or events.data found, returning empty result');
        return {
          data: [],
          totalPages: 0
        };
      }

      const expirationDate = EVENT_CONFIG.getExpirationDate(role);
      
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
      categories.forEach((category: ICategory) => {
        void preloadEventsByCategory(country, category.name, role);
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
    revalidate: false,
    tags: ['events']
  }
); 