'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { unstable_cache } from 'next/cache';
import { eventCache, invalidateEventCache } from '@/lib/cache/eventCache';

import mongoose from 'mongoose'; // Added for ObjectId validation
import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import User from '@/lib/database/models/user.model'
import Category from '@/lib/database/models/category.model'
import { handleError } from '@/lib/utils'

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from '@/types'

import { IEvent } from '@/lib/database/models/event.model';
import Order from '@/lib/database/models/order.model';
import { getOrderCountByEvent, getTotalRegistrationsByEvent } from '@/lib/actions/order.actions';
import type { Document } from 'mongoose';
import { EVENT_CONFIG } from '@/lib/config/event.config';

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: 'i' } })
}

const populateEvent = (query: any) => {
  return query
    .populate({ path: 'organizer', model: User, select: '_id' })
    .populate({ path: 'category', model: Category, select: '_id name' })
}

// CREATE
export async function createEvent({ userId, event, path }: CreateEventParams) {
  try {
    console.log("createEvent called with:", { userId, event, path });
    await connectToDatabase();
    console.log("Database connected successfully");

    const organizer = await User.findById(userId);
    console.log("Organizer lookup result:", organizer);
    
    if (!organizer) throw new Error('Organizer not found');

    console.log("Creating new event with data:", { 
      ...event, 
      category: event.categoryId, 
      organizer: userId,
      customFields: event.customFields
    });

    const newEvent = await Event.create({ 
      ...event, 
      category: event.categoryId, 
      organizer: userId,
      customFields: event.customFields
    });

    console.log("New event created successfully:", newEvent);

    // Invalidate caches
    await invalidateEventCache.onMajorEventUpdate();
    revalidatePath(path);
    revalidatePath('/');
    revalidateTag('events');

    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    console.error("Error in createEvent:", error);
    handleError(error);
  }
}

// GET ONE EVENT BY ID
export const getEventById = async (eventId: string) => {
    try {
      // Validate eventId format before querying
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        console.warn(`Invalid ObjectId format received in getEventById: ${eventId}`);
        return null; // Return null if ID format is invalid
      }

      // Use cached query for event details
      return await eventCache.getEventDetails(eventId, async () => {
        await connectToDatabase();

        const event = await Event.findOne({ _id: eventId, isDeleted: { $ne: true } })
          .populate({ path: 'organizer', model: User, select: '_id' })
          .populate({ path: 'category', model: Category, select: '_id name' });

        if (!event) {
          // Event not found, return null to be handled by the caller
          // This allows the UI to display a "not found" message gracefully
          return null;
        }

        const attendeeCount = await Order.countDocuments({ event: eventId });

        return {
          ...JSON.parse(JSON.stringify(event)),
          attendeeCount,
        };
      });
    } catch (error) {
      handleError(error);
      return null;
    }
};

// UPDATE
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase();

    const eventToUpdate = await Event.findById(event._id);
    if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== userId) {
      throw new Error('Unauthorized or event not found');
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { 
        ...event, 
        category: event.categoryId,
        customFields: event.customFields
      },
      { new: true }
    );
    
    // Invalidate caches for updated event
    await invalidateEventCache.onEventUpdate(event._id);
    
    // Revalidate all relevant caches
    revalidatePath(path);
    revalidatePath('/');
    revalidateTag('events');
    revalidateTag('event-images');

    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteEvent({ eventId, path }: DeleteEventParams) {
  try {
    await connectToDatabase()

    const deletedEvent = await Event.findByIdAndUpdate(
      eventId,
      { isDeleted: true },
      { new: true }
    )
    
    // Invalidate caches for deleted event
    if (deletedEvent) {
      await invalidateEventCache.onEventUpdate(eventId);
      revalidatePath(path);
      revalidatePath('/');
      revalidateTag('events');
      revalidateTag('event-images');
    }
  } catch (error) {
    handleError(error)
  }
}

// GET ALL EVENTS (Regular users - with date filtering)
export async function getAllEvents({ query, limit = 6, page, category, country, role }: GetAllEventsParams & { role?: string }) {
      try {
        // Connect to database first and handle connection errors explicitly
        try {
          await connectToDatabase();
        } catch (dbError) {
          console.error('Database connection error:', dbError);
          throw new Error('Failed to connect to database. Please try again later.');
        }

        const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {}
        let categoryCondition = null;
        
        try {
          categoryCondition = category ? await getCategoryByName(category) : null;
        } catch (categoryError) {
          console.error('Error fetching category:', categoryError);
          // Continue without category filter if there's an error
        }
        
        // Add date filtering condition
        const expirationDate = EVENT_CONFIG.getExpirationDate(role);
        const dateCondition = { endDateTime: { $gte: expirationDate } };

        const conditions = {
          $and: [
            titleCondition,
            categoryCondition ? { category: categoryCondition._id } : {},
            { country: country },
            { isDeleted: { $ne: true } },
            dateCondition
          ]
        }

        const skipAmount = (Number(page) - 1) * limit
        
        // Parallel queries without field projection to get all fields
        const [events, eventsCount] = await Promise.all([
          Event.find(conditions)
            .sort({ startDateTime: 'desc', createdAt: 'desc' })
            .skip(skipAmount)
            .limit(limit)
            .populate({ 
              path: 'organizer', 
              model: User,
              select: '_id firstName lastName'
            })
            .populate({ 
              path: 'category', 
              model: Category,
              select: '_id name'
            })
            .lean()
            .exec(),
          Event.countDocuments(conditions)
        ]);

        // Batch fetch registration counts
        const eventIds = events.map(event => event._id);
        const orders = await Order.find({ 
          event: { $in: eventIds } 
        })
        .select('event customFieldValues')
        .lean()
        .exec();

        // Create a map for faster lookup using Set for O(1) lookups
        const registrationCountMap = new Map();
        orders.forEach(order => {
          const eventId = order.event.toString();
          registrationCountMap.set(
            eventId, 
            (registrationCountMap.get(eventId) || 0) + order.customFieldValues.length
          );
        });

        const eventsWithCount = events.map((event: any) => ({
          ...event,
          registrationCount: registrationCountMap.get(event._id.toString()) || 0
        }));

        return { 
          data: eventsWithCount, 
          totalPages: Math.ceil(eventsCount / limit) 
        }
      } catch (error) {
        handleError(error)
        return { data: [], totalPages: 0 }
      }
}

// GET ALL EVENTS (Superadmin - without date filtering)
export async function getAllEventsForSuperAdmin({ query, limit = 6, page, category, country }: GetAllEventsParams) {
  try {
    await connectToDatabase()

    const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {}
    const categoryCondition = category ? await getCategoryByName(category) : null

    const conditions = {
      $and: [
        titleCondition,
        categoryCondition ? { category: categoryCondition._id } : {},
        { country: country },
        { isDeleted: { $ne: true } }
      ]
    }

    // Remove skip for getting all events
    const skipAmount = page ? (Number(page) - 1) * limit : 0;
    
    // Parallel queries without field projection to get all fields
    const [events, eventsCount] = await Promise.all([
      Event.find(conditions)
        .sort({ startDateTime: 'desc', createdAt: 'desc' })
        .skip(skipAmount)
        .limit(Number(limit)) // Ensure limit is treated as a number
        .populate({ 
          path: 'organizer', 
          model: User,
          select: '_id firstName lastName'
        })
        .populate({ 
          path: 'category', 
          model: Category,
          select: '_id name'
        })
        .lean()
        .exec(),
      Event.countDocuments(conditions)
    ]);

    // Batch fetch registration counts
    const eventIds = events.map(event => event._id);
    const orders = await Order.find({ 
      event: { $in: eventIds } 
    })
    .select('event customFieldValues')
    .lean()
    .exec();

    // Create a map for faster lookup using Set for O(1) lookups
    const registrationCountMap = new Map();
    orders.forEach(order => {
      const eventId = order.event.toString();
      registrationCountMap.set(
        eventId, 
        (registrationCountMap.get(eventId) || 0) + order.customFieldValues.length
      );
    });

    const eventsWithCount = events.map((event: any) => ({
      ...event,
      registrationCount: registrationCountMap.get(event._id.toString()) || 0
    }));

    return { 
      data: eventsWithCount, 
      totalPages: Math.ceil(eventsCount / limit) 
    }
  } catch (error) {
    handleError(error)
    return { data: [], totalPages: 0 }
  }
}

// GET EVENTS BY ORGANIZER
export async function getEventsByUser({ userId, limit = 6, page }: GetEventsByUserParams) {
  try {
    await connectToDatabase();

    const currentDate = new Date();
    const conditions = { 
      organizer: userId, 
      endDateTime: { $gte: currentDate },
      isDeleted: { $ne: true }
    }; // Filter out past events
    const skipAmount = (page - 1) * limit;

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    const eventsWithRegistrationCount = await Promise.all(events.map(async (event: IEvent) => {
      const orders = await Order.find({ event: event._id });
      const registrationCount = orders.reduce((total, order) => total + order.customFieldValues.length, 0);
      return {
        ...JSON.parse(JSON.stringify(event)),
        registrationCount
      };
    }));

    return { data: eventsWithRegistrationCount, totalPages: Math.ceil(eventsCount / limit) };
  } catch (error) {
    handleError(error);
  }
}

// GET RELATED EVENTS: EVENTS WITH SAME CATEGORY
export async function getRelatedEventsByCategory({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase()

    const skipAmount = (Number(page) - 1) * limit
    const conditions = { 
      $and: [
        { category: categoryId }, 
        { _id: { $ne: eventId } },
        { isDeleted: { $ne: true } }
      ] 
    }

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    return { data: JSON.parse(JSON.stringify(events)), totalPages: Math.ceil(eventsCount / limit) }
  } catch (error) {
    handleError(error)
  }
}

export const getEventCategory = async (eventId: string): Promise<string | null> => {
  try {
    await connectToDatabase();

    const event = await Event.findById(eventId).populate('category', 'name');
    
    if (!event) {
      // Event not found, return null
      console.warn(`Event category not found for eventId: ${eventId}`);
      return null;
    }

    return event.category?.name || null; // Return the category name or null if not found
  } catch (error) {
    console.error('Error fetching event category:', error);
    // It's good practice to also capture this unexpected error with Sentry if it's not a simple "not found"
    // For now, just returning null as per existing logic for other errors.
    return null; // Return null in case of an error
  }
};