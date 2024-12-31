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
    await connectToDatabase();

    const organizer = await User.findById(userId);
    if (!organizer) throw new Error('Organizer not found');

    const newEvent = await Event.create({ 
      ...event, 
      category: event.categoryId, 
      organizer: userId,
      customFields: event.customFields
    });

    revalidatePath(path);
    revalidatePath('/');
    revalidateTag('events');

    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    handleError(error);
  }
}

// GET ONE EVENT BY ID
export const getEventById = unstable_cache(
  async (eventId: string) => {
    try {
      await connectToDatabase();

      const event = await Event.findById(eventId)
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
    revalidate: 60, // Cache for 1 minute
    tags: ['event']
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
    revalidatePath(path);
    revalidatePath('/');
    revalidateTag('events');

    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteEvent({ eventId, path }: DeleteEventParams) {
  try {
    await connectToDatabase()

    const deletedEvent = await Event.findByIdAndDelete(eventId)
    if (deletedEvent) revalidatePath(path)
    revalidatePath('/');
    revalidateTag('events');
  } catch (error) {
    handleError(error)
  }
}

// GET ALL EVENTS
export async function getAllEvents({ query, limit = 6, page, category, country }: GetAllEventsParams) {
  const cacheKey = `events-${query}-${limit}-${page}-${category}-${country}`;
  
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase()

        const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {}
        const categoryCondition = category ? await getCategoryByName(category) : null
        const conditions = {
          $and: [
            titleCondition,
            categoryCondition ? { category: categoryCondition._id } : {},
            { country: country }
          ]
        }

        const skipAmount = (Number(page) - 1) * limit
        
        // Only select necessary fields
        const projection = {
          title: 1,
          description: 1,
          startDateTime: 1,
          endDateTime: 1,
          imageUrl: 1,
          url: 1,
          location: 1,
          country: 1,
          category: 1,
          organizer: 1,
          createdAt: 1,
        };

        // Parallel queries with field projection
        const [events, eventsCount] = await Promise.all([
          Event.find(conditions, projection)
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
            .exec(), // Add exec() for better performance
          Event.countDocuments(conditions)
        ]);

        // Batch fetch registration counts with projection
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
    ['events-list'],
    {
      revalidate: 60, // Reduce to 1 minute to match API
      tags: ['events']
    }
  )();
}


// GET EVENTS BY ORGANIZER
export async function getEventsByUser({ userId, limit = 6, page }: GetEventsByUserParams) {
  try {
    await connectToDatabase();

    const currentDate = new Date();
    const conditions = { organizer: userId, endDateTime: { $gte: currentDate } }; // Filter out past events
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
    const conditions = { $and: [{ category: categoryId }, { _id: { $ne: eventId } }] }

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