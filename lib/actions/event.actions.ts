'use server'

import { revalidatePath } from 'next/cache'

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
      customFields: event.customFields // Ensure customFields are saved
    });
    revalidatePath(path);

    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    handleError(error);
  }
}

// GET ONE EVENT BY ID
export async function getEventById(eventId: string) {
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
}

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
        customFields: event.customFields // Ensure customFields are updated
      },
      { new: true }
    );
    revalidatePath(path);

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
  } catch (error) {
    handleError(error)
  }
}

// GET ALL EVENTS
export async function getAllEvents({
  query,
  category,
  page,
  limit,
  country
}: GetAllEventsParams) {
  try {
    await connectToDatabase()

    const titleCondition = query ? { title: { $regex: query, $options: 'i' } } : {}
    const categoryCondition = category ? { 'category.name': category } : {}
    const countryCondition = country ? { country: country } : {}

    const conditions = {
      $and: [
        titleCondition,
        categoryCondition,
        countryCondition,
        { endDateTime: { $gte: new Date() } }
      ]
    }

    const skipAmount = (Number(page) - 1) * limit
    
    const eventsQuery = Event.find(conditions)
      .populate({
        path: 'organizer',
        select: '_id firstName lastName'
      })
      .populate('category')
      .sort({ startDateTime: 'asc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await eventsQuery.exec()
    
    // Transform events to include required fields
    const transformedEvents = await Promise.all(events.map(async (event) => {
      // Get orders for this event
      const orders = await Order.find({ event: event._id });
      
      // Calculate total registrations from orders
      const registrationCount = orders.reduce((total, order) => 
        total + (order.customFieldValues?.length || 0), 0
      );
      
      return {
        ...event.toObject(),
        registrationCount,
        orderId: undefined,
        customFieldValues: [],
        queueNumber: undefined,
        _id: event._id.toString(), // Ensure _id is a string
        organizer: {
          ...event.organizer,
          _id: event.organizer._id.toString() // Ensure organizer._id is a string
        },
        category: {
          ...event.category,
          _id: event.category._id.toString() // Ensure category._id is a string
        }
      }
    }))

    const totalPages = Math.ceil(await Event.countDocuments(conditions) / limit)

    return {
      data: transformedEvents,
      totalPages
    }
  } catch (error) {
    console.error('Error in getAllEvents:', error)
    throw error
  }
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