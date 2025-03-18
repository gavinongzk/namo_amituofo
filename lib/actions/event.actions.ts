'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { unstable_cache } from 'next/cache';

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
export const getEventById = unstable_cache(
  async (eventId: string) => {
    try {
      await connectToDatabase();

      const event = await Event.findOne({ _id: eventId, isDeleted: { $ne: true } })
        .populate({ path: 'organizer', model: User, select: '_id' })
        .populate({ path: 'category', model: Category, select: '_id name' });

      if (!event) {
        throw new Error('Event not found');
      }

      const attendeeCount = await Order.countDocuments({ event: eventId });

      return {
        ...JSON.parse(JSON.stringify(event)),
        attendeeCount,
      };
    } catch (error) {
      handleError(error);
      return null;
    }
  },
  ['event-by-id'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['events', 'event-images']
  }
);

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
    
    // Revalidate all relevant caches
    if (deletedEvent) {
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
  const cacheKey = `events-${query}-${limit}-${page}-${category}-${country}-${role}`;
  
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase()

        const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {}
        const categoryCondition = category ? await getCategoryByName(category) : null
        
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
    },
    ['events-list', cacheKey],
    {
      revalidate: 300, // Cache for 5 minutes
      tags: ['events', 'event-images']
    }
  )();
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
      throw new Error('Event not found');
    }

    return event.category?.name || null; // Return the category name or null if not found
  } catch (error) {
    console.error('Error fetching event category:', error);
    return null; // Return null in case of an error
  }
};