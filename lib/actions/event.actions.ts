'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { unstable_cache } from 'next/cache';

import mongoose from 'mongoose'; // Added for ObjectId validation
import { connectToDatabase } from '@/lib/database'
import { Event, User, Category, Order, IEvent } from '@/lib/database/models'
import { handleError } from '@/lib/utils'

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from '@/types'
import { getOrderCountByEvent, getTotalRegistrationsByEvent } from '@/lib/actions/order.actions';
import type { Document } from 'mongoose';
import { EVENT_CONFIG } from '@/lib/config/event.config';

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: 'i' } })
}

const populateEvent = (query: any) => {
  return query
    .populate({ path: 'organizer', model: User, select: '_id' })
    .populate({ path: 'category', model: Category, select: '_id name color' })
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

    const isSuperAdmin = organizer.role === 'superadmin';

    const newEvent = await Event.create({ 
      ...event, 
      category: event.categoryId, 
      organizer: userId,
      customFields: event.customFields,
      isDraft: isSuperAdmin ? (event.isDraft !== undefined ? event.isDraft : false) : false
    });

    console.log("New event created successfully:", newEvent);

    revalidatePath(path);
    revalidatePath('/');
    revalidatePath('/events');
    revalidateTag('events');
    revalidateTag('admin-events');
    revalidateTag('api-events-list');
    revalidateTag('superadmin-events-list');

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

      await connectToDatabase();

      const event = await Event.findOne({ _id: eventId, isDeleted: { $ne: true } })
        .populate({ path: 'organizer', model: User, select: '_id' })
        .populate({ path: 'category', model: Category, select: '_id name color' });

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

    const organizer = await User.findById(userId);
    const isSuperAdmin = organizer?.role === 'superadmin';

    const updateData: any = { 
      ...event, 
      category: event.categoryId,
      customFields: event.customFields
    };
    if (typeof event.isDraft !== 'undefined' && isSuperAdmin) {
      updateData.isDraft = event.isDraft;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      updateData,
      { new: true }
    );
    
    // Revalidate all relevant caches
    revalidatePath(path);
    revalidatePath('/');
    revalidatePath('/events');
    revalidateTag('events');
    revalidateTag('admin-events');
    revalidateTag('event-images');
    revalidateTag('api-events-list');
    revalidateTag('superadmin-events-list');

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
        { isDraft: { $ne: true } },
        dateCondition
      ]
    }

    const skipAmount = (Number(page) - 1) * limit
    
    // Optimize: Use aggregation pipeline for better performance
    const pipeline = [
      { $match: conditions },
      { $sort: { startDateTime: -1 as const, createdAt: -1 as const } },
      { $skip: skipAmount },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
          foreignField: '_id',
          as: 'organizer',
          pipeline: [
            { $project: { _id: 1, firstName: 1, lastName: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [
            { $project: { _id: 1, name: 1, color: 1 } }
          ]
        }
      },
      {
        $addFields: {
          organizer: { $arrayElemAt: ['$organizer', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      }
    ];

    // Parallel queries with optimized aggregation
    const [events, eventsCount] = await Promise.all([
      Event.aggregate(pipeline).exec(),
      Event.countDocuments(conditions)
    ]);

    // Only fetch registration counts if we have events
    if (events.length === 0) {
      return { 
        data: [], 
        totalPages: 0 
      };
    }

    // Optimize: Batch fetch registration counts with projection
    const eventIds = events.map(event => event._id);
    const orders = await Order.aggregate([
      { $match: { event: { $in: eventIds } } },
      { $project: { event: 1, customFieldValues: 1 } },
      {
        $group: {
          _id: '$event',
          count: { $sum: { $size: '$customFieldValues' } }
        }
      }
    ]).exec();

    // Create a map for faster lookup
    const registrationCountMap = new Map();
    orders.forEach(order => {
      registrationCountMap.set(order._id.toString(), order.count);
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
    console.error('Error in getAllEvents:', error);
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

    const skipAmount = page ? (Number(page) - 1) * limit : 0;
    
    // Optimize: Use aggregation pipeline for better performance
    const pipeline = [
      { $match: conditions },
      { $sort: { startDateTime: -1 as const, createdAt: -1 as const } },
      { $skip: skipAmount },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
          foreignField: '_id',
          as: 'organizer',
          pipeline: [
            { $project: { _id: 1, firstName: 1, lastName: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [
            { $project: { _id: 1, name: 1, color: 1 } }
          ]
        }
      },
      {
        $addFields: {
          organizer: { $arrayElemAt: ['$organizer', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      }
    ];

    // Parallel queries with optimized aggregation
    const [events, eventsCount] = await Promise.all([
      Event.aggregate(pipeline).exec(),
      Event.countDocuments(conditions)
    ]);

    // Only fetch registration counts if we have events
    if (events.length === 0) {
      return { 
        data: [], 
        totalPages: 0 
      };
    }

    // Optimize: Batch fetch registration counts with aggregation
    const eventIds = events.map(event => event._id);
    const orders = await Order.aggregate([
      { $match: { event: { $in: eventIds } } },
      { $project: { event: 1, customFieldValues: 1 } },
      {
        $group: {
          _id: '$event',
          count: { $sum: { $size: '$customFieldValues' } }
        }
      }
    ]).exec();

    // Create a map for faster lookup
    const registrationCountMap = new Map();
    orders.forEach(order => {
      registrationCountMap.set(order._id.toString(), order.count);
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
    console.error('Error in getAllEventsForSuperAdmin:', error);
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
        { isDeleted: { $ne: true } },
        { isDraft: { $ne: true } }
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

    const event = await Event.findById(eventId).populate('category', 'name color');
    
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

// GET EVENTS FOR SELECTION (Lightweight - no registration counts)
export async function getEventsForSelection({ country, role }: { country: string; role?: string }) {
  try {
    await connectToDatabase();

    // Add date filtering condition for non-superadmins
    const expirationDate = EVENT_CONFIG.getExpirationDate(role);
    const dateCondition = role !== 'superadmin' ? { endDateTime: { $gte: expirationDate } } : {};

    const conditions = {
      $and: [
        { country: country },
        { isDeleted: { $ne: true } },
        { isDraft: { $ne: true } },
        dateCondition
      ]
    };

    // Lightweight query - no registration counts, minimal fields
    const events = await Event.find(conditions)
      .select('_id title startDateTime endDateTime location maxSeats category')
      .populate({ path: 'category', model: Category, select: '_id name color' })
      .sort({ startDateTime: -1, createdAt: -1 })
      .limit(50) // Reasonable limit for selection
      .lean();

    return events;
  } catch (error) {
    console.error('Error in getEventsForSelection:', error);
    return [];
  }
}

// GET EVENTS FOR MAIN PAGE (Optimized with caching)
export async function getEventsForMainPage({ query, limit = 6, page, category, country, role }: GetAllEventsParams & { role?: string }) {
  try {
    await connectToDatabase();

    const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {};
    let categoryCondition = null;
    
    try {
      categoryCondition = category ? await getCategoryByName(category) : null;
    } catch (categoryError) {
      console.error('Error fetching category:', categoryError);
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
        { isDraft: { $ne: true } },
        dateCondition
      ]
    };

    const skipAmount = (Number(page) - 1) * limit;
    
    // Optimized pipeline - only fetch registration counts if needed
    const pipeline = [
      { $match: conditions },
      { $sort: { startDateTime: -1 as const, createdAt: -1 as const } },
      { $skip: skipAmount },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
          foreignField: '_id',
          as: 'organizer',
          pipeline: [{ $project: { _id: 1, firstName: 1, lastName: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { _id: 1, name: 1, color: 1 } }]
        }
      },
      {
        $addFields: {
          organizer: { $arrayElemAt: ['$organizer', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      }
    ];

    const [events, eventsCount] = await Promise.all([
      Event.aggregate(pipeline).exec(),
      Event.countDocuments(conditions)
    ]);

    // Only fetch registration counts for main page if explicitly requested
    if (events.length === 0) {
      return { data: [], totalPages: 0 };
    }

    // Lightweight registration count - only if events exist
    const eventIds = events.map(event => event._id);
    const registrationCounts = await Order.aggregate([
      { $match: { event: { $in: eventIds } } },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 }
        }
      }
    ]).exec();

    const countMap = new Map(registrationCounts.map(item => [item._id.toString(), item.count]));

    const eventsWithCount = events.map((event: any) => ({
      ...event,
      registrationCount: countMap.get(event._id.toString()) || 0
    }));

    return { 
      data: eventsWithCount, 
      totalPages: Math.ceil(eventsCount / limit) 
    };
  } catch (error) {
    console.error('Error in getEventsForMainPage:', error);
    return { data: [], totalPages: 0 };
  }
}