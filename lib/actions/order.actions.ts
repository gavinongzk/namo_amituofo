"use server"

import { CreateOrderParams, GetOrdersByEventParams, GetOrdersByUserParams } from "@/types"
import { handleError } from '../utils';
import { connectToDatabase } from '../database';
import Order from '../database/models/order.model';
import Event from '../database/models/event.model';
import Category from '../database/models/category.model';
import {ObjectId} from 'mongodb';
import { IOrder, IOrderItem } from '../database/models/order.model';
import QRCode from 'qrcode';
import { CustomFieldGroup } from '@/types'
import { unstable_cache } from 'next/cache'

export async function createOrder(order: CreateOrderParams) {
  try {
    await connectToDatabase();
    console.log("Connected to database");

    if (!ObjectId.isValid(order.eventId)) {
      console.log("Invalid eventId:", order.eventId);
      throw new Error('Invalid eventId');
    }

    const event = await Event.findById(order.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Count only uncancelled registrations
    const currentRegistrations = await Order.aggregate([
      { $match: { event: new ObjectId(order.eventId) } },
      { $unwind: "$customFieldValues" },
      { $match: { "customFieldValues.cancelled": { $ne: true } } },
      { $count: "total" }
    ]);

    const totalRegistrations = currentRegistrations[0]?.total || 0;

    if (totalRegistrations >= event.maxSeats) {
      throw new Error('Event is fully booked');
    }

    const lastOrder = await Order.findOne({ event: order.eventId }).sort({ createdAt: -1 });
    let lastQueueNumber = 0;
    if (lastOrder) {
      const allQueueNumbers = lastOrder.customFieldValues.map((group: { queueNumber: string }) => 
        parseInt(group.queueNumber.slice(1))
      );
      lastQueueNumber = Math.max(...allQueueNumbers);
    }

    const newCustomFieldValues = await Promise.all(order.customFieldValues.map(async (group, index) => {
      const newQueueNumber = `${(lastQueueNumber + index + 1).toString().padStart(3, '0')}`;
      
      // Find phone number from fields
      const phoneField = group.fields.find(field => 
        field.label.toLowerCase().includes('phone') || 
        field.type === 'phone'
      );
      const phoneNumber = phoneField?.value || '';
      
      // Create QR code data with event ID, queue number, and phone number
      const qrCodeData = `${order.eventId}_${newQueueNumber}_${encodeURIComponent(phoneNumber)}`;
      const qrCode = await QRCode.toDataURL(qrCodeData);
      
      return {
        ...group,
        queueNumber: newQueueNumber,
        qrCode: qrCode,
        cancelled: false,
        __v: 0,
      };
    }));

    const newOrder = await Order.create({
      ...order,
      event: new ObjectId(order.eventId),
      customFieldValues: newCustomFieldValues,
    });

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// GET ORDERS BY EVENT
export async function getOrdersByEvent({ searchString, eventId, select }: GetOrdersByEventParams) {
  try {
    await connectToDatabase();

    if (!eventId) throw new Error('Event ID is required');
    const eventObjectId = new ObjectId(eventId);

    let query = { event: eventObjectId };

    if (searchString) {
      const lowercasedSearchString = searchString.toLowerCase();
      const queryObject = {
        event: query.event,
        $or: [
          { 'customFieldValues.fields.value': { $regex: lowercasedSearchString, $options: 'i' } },
          { 'customFieldValues.queueNumber': { $regex: lowercasedSearchString, $options: 'i' } }
        ]
      };
      query = queryObject;
    }

    const baseQuery = Order.find(query);
    
    // Handle field selection
    const eventFields = select ? 
      select.split(' ')
        .filter(f => f.startsWith('event.'))
        .map(f => f.replace('event.', ''))
        .join(' ') : 
      'title imageUrl startDateTime endDateTime location';

    const orders = await baseQuery
      .populate({
        path: 'event',
        select: eventFields
      })
      .lean();

    return orders;
  } catch (error) {
    console.error('Error in getOrdersByEvent:', error);
    handleError(error);
  }
}

export const getOrderById = unstable_cache(
  async (orderId: string) => {
    try {
      await connectToDatabase();
      const order = await Order.findById(orderId)
        .populate('event')
        .populate('buyer')
        .select('-__v') // Exclude version field but keep all other fields including qrCode
        .lean(); // Use lean() for better performance
      
      if (!order) throw new Error('Order not found');
      return JSON.parse(JSON.stringify(order));
    } catch (error) {
      handleError(error);
    }
  },
  ['order-details'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['order-details', 'orders'] // Cache tags for invalidation
  }
);

export async function getOrderCountByEvent(eventId: string) {
  try {
    await connectToDatabase();

    if (!ObjectId.isValid(eventId)) {
      throw new Error('Invalid eventId');
    }

    // Count total registrations regardless of cancelled status
    // since maxSeats is already adjusted during cancellation
    const orders = await Order.find({ event: eventId });
    const totalRegistrations = orders.reduce((count, order) => {
      return count + order.customFieldValues.length;
    }, 0);

    return totalRegistrations;
  } catch (error) {
    console.error('Error fetching registration count:', error);
    throw error;
  }
}

export async function getTotalRegistrationsByEvent(eventId: string) {
  try {
    await connectToDatabase();

    if (!ObjectId.isValid(eventId)) {
      throw new Error('Invalid eventId');
    }

    const orders = await Order.find({ event: eventId });
    const totalRegistrations = orders.reduce((count, order) => {
      return count + order.customFieldValues.filter((group: { cancelled: boolean }) => !group.cancelled).length;
    }, 0);

    return totalRegistrations;
  } catch (error) {
    console.error('Error fetching total registrations:', error);
    throw error;
  }
}

export const getOrdersByPhoneNumber = async (phoneNumber: string) => {
  try {
    await connectToDatabase();
    
    console.log('Searching for phone number:', phoneNumber);

    // Remove any cache-busting query params from the phone number
    const cleanPhoneNumber = phoneNumber.split('?')[0];

    // Get current date for filtering events that haven't ended yet
    const currentDate = new Date();

    // Ensure Category model is registered before using it
    require('../database/models/category.model');

    const orders = await Order.find({
      'customFieldValues.fields': {
        $elemMatch: {
          $or: [
            { type: 'phone', value: cleanPhoneNumber },
            { label: { $regex: /phone/i }, value: cleanPhoneNumber }
          ]
        }
      }
    })
    .populate({
      path: 'event',
      match: { endDateTime: { $gte: currentDate } }, // Only include events that haven't ended yet
      select: '_id title imageUrl startDateTime endDateTime organizer',
      populate: {
        path: 'category',
        model: 'Category',
        select: '_id name'
      }
    })
    .lean();

    console.log('Found orders:', JSON.stringify(orders, null, 2));
    
    // Filter out any null events (those that didn't match the date criteria)
    const filteredOrders = orders.filter(order => order.event);
    
    console.log('Filtered orders:', JSON.stringify(filteredOrders, null, 2));

    // Group orders by event ID
    const eventMap: Record<string, any> = {};
    
    filteredOrders.forEach((order: any) => {
      const eventId = order.event._id.toString();
      
      if (!eventMap[eventId]) {
        eventMap[eventId] = {
          event: {
            ...order.event,
            orderId: order._id.toString(), // Use the first order ID as the representative ID
          },
          orderIds: [order._id.toString()], // Array to store all order IDs
          registrations: [],
        };
      } else {
        // Add this order ID to the list
        eventMap[eventId].orderIds.push(order._id.toString());
      }
      
      // Add only non-cancelled registrations from this order
      order.customFieldValues.forEach((group: any) => {
        // Skip cancelled registrations
        if (group.cancelled) return;
        
        const nameField = group.fields?.find((field: any) => 
          field.label.toLowerCase().includes('name'))?.value || 'Unknown';
          
        eventMap[eventId].registrations.push({
          queueNumber: group.queueNumber,
          name: nameField,
          orderId: order._id.toString(), // Store the order ID for each registration
          groupId: group.groupId, // Include groupId for reference
        });
      });
    });
    
    // Convert map to array and sort by start date (newest first)
    const groupedOrders = Object.values(eventMap)
      .sort((a: any, b: any) => 
        new Date(b.event.startDateTime).getTime() - new Date(a.event.startDateTime).getTime()
      );

    // Explicitly mark this response as uncacheable
    return JSON.parse(JSON.stringify(groupedOrders));
  } catch (error) {
    console.error('Error in getOrdersByPhoneNumber:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const getAllOrdersByPhoneNumber = async (phoneNumber: string) => {
  try {
    await connectToDatabase();

    // Remove any cache-busting query params from the phone number
    const cleanPhoneNumber = phoneNumber.split('?')[0];

    // Ensure Category model is registered
    require('../database/models/category.model');

    const orders = await Order.find({
      'customFieldValues.fields': {
        $elemMatch: {
          $or: [
            { type: 'phone', value: cleanPhoneNumber },
            { label: { $regex: /phone/i }, value: cleanPhoneNumber }
          ]
        }
      }
    })
    .populate({
      path: 'event',
      select: '_id title imageUrl startDateTime endDateTime organizer',
      populate: {
        path: 'category',
        model: 'Category',
        select: '_id name'
      }
    })
    .lean();

    // Filter out cancelled registrations from the results
    const ordersWithoutCancelled = orders.map(order => ({
      ...order,
      customFieldValues: order.customFieldValues.filter((group: any) => !group.cancelled)
    }));

    return JSON.parse(JSON.stringify(ordersWithoutCancelled));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAllOrdersByPhoneNumberIncludingCancelled = async (phoneNumber: string) => {
  try {
    await connectToDatabase();
    
    console.log('Searching for phone number (including cancelled):', phoneNumber);

    // Remove any cache-busting query params from the phone number
    const cleanPhoneNumber = phoneNumber.split('?')[0];

    // Get current date for filtering events that haven't ended yet
    const currentDate = new Date();

    // Ensure Category model is registered before using it
    require('../database/models/category.model');

    const orders = await Order.find({
      'customFieldValues.fields': {
        $elemMatch: {
          $or: [
            { type: 'phone', value: cleanPhoneNumber },
            { label: { $regex: /phone/i }, value: cleanPhoneNumber }
          ]
        }
      }
    })
    .populate({
      path: 'event',
      match: { endDateTime: { $gte: currentDate } }, // Only include events that haven't ended yet
      select: '_id title imageUrl startDateTime endDateTime organizer',
      populate: {
        path: 'category',
        model: 'Category',
        select: '_id name'
      }
    })
    .lean();
    
    // Filter out any null events (those that didn't match the date criteria)
    const filteredOrders = orders.filter(order => order.event);
    
    // Group orders by event ID
    const eventMap: Record<string, any> = {};
    
    filteredOrders.forEach((order: any) => {
      const eventId = order.event._id.toString();
      
      if (!eventMap[eventId]) {
        eventMap[eventId] = {
          event: {
            ...order.event,
            orderId: order._id.toString(), // Use the first order ID as the representative ID
          },
          orderIds: [order._id.toString()], // Array to store all order IDs
          registrations: [],
        };
      } else {
        // Add this order ID to the list
        eventMap[eventId].orderIds.push(order._id.toString());
      }
      
      // Add all registrations from this order, including cancelled ones
      order.customFieldValues.forEach((group: any) => {
        const nameField = group.fields?.find((field: any) => 
          field.label.toLowerCase().includes('name'))?.value || 'Unknown';
          
        eventMap[eventId].registrations.push({
          queueNumber: group.queueNumber,
          name: nameField,
          orderId: order._id.toString(), // Store the order ID for each registration
          groupId: group.groupId, // Include groupId for reference
          cancelled: !!group.cancelled // Include cancelled status
        });
      });
    });
    
    // Convert map to array and sort by start date (newest first)
    const groupedOrders = Object.values(eventMap)
      .sort((a: any, b: any) => 
        new Date(b.event.startDateTime).getTime() - new Date(a.event.startDateTime).getTime()
      );

    return JSON.parse(JSON.stringify(groupedOrders));
  } catch (error) {
    console.error('Error in getAllOrdersByPhoneNumberIncludingCancelled:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const getGroupIdsByEventId = async (eventId: string): Promise<string[]> => {
  try {
    await connectToDatabase();

    const orders = await Order.find({ event: eventId }).exec();
    const groupIds = orders.flatMap(order => 
      order.customFieldValues.map( (group: CustomFieldGroup) => group.groupId)
    );

    return groupIds;
  } catch (error) {
    console.error('Error fetching group IDs:', error);
    throw new Error('Failed to fetch group IDs');
  }
};

export const getCachedOrderCount = unstable_cache(
  async (eventId: string) => {
    return getOrderCountByEvent(eventId)
  },
  ['event-order-count'],
  { revalidate: 30 } // Cache for 30 seconds
)

export const aggregateOrdersByPhoneNumber = async (phoneNumber: string) => {
  try {
    return await unstable_cache(
      async () => {
        await connectToDatabase();
        
        // Remove any cache-busting query params from the phone number
        const cleanPhoneNumber = phoneNumber.split('?')[0];
        
        // Get current date for filtering events that haven't ended yet
        const currentDate = new Date();
        
        // Use MongoDB aggregation pipeline for better performance
        const aggregatedOrders = await Order.aggregate([
          // Match orders with the given phone number - improved matching logic
          {
            $match: {
              'customFieldValues.fields': {
                $elemMatch: {
                  $or: [
                    { type: 'phone', value: cleanPhoneNumber },
                    { label: { $regex: /phone/i }, value: cleanPhoneNumber },
                    { label: { $regex: /contact.?number/i }, value: cleanPhoneNumber }
                  ]
                }
              }
            }
          },
          // Lookup event details
          {
            $lookup: {
              from: 'events',
              localField: 'event',
              foreignField: '_id',
              as: 'eventDetails'
            }
          },
          // Unwind the event array
          { $unwind: '$eventDetails' },
          // Match only events that haven't ended
          {
            $match: {
              'eventDetails.endDateTime': { $gte: currentDate }
            }
          },
          // Group by event
          {
            $group: {
              _id: '$eventDetails._id',
              event: { $first: '$eventDetails' },
              orderIds: { $push: '$_id' },
              registrations: {
                $push: {
                  $map: {
                    input: '$customFieldValues',
                    as: 'group',
                    in: {
                      queueNumber: '$$group.queueNumber',
                      name: {
                        $reduce: {
                          input: {
                            $filter: {
                              input: '$$group.fields',
                              as: 'field',
                              cond: {
                                $regexMatch: {
                                  input: { $toLower: '$$field.label' },
                                  regex: 'name'
                                }
                              }
                            }
                          },
                          initialValue: 'Unknown',
                          in: { $ifNull: ['$$this.value', '$$value'] }
                        }
                      },
                      orderId: '$_id',
                      groupId: '$$group.groupId',
                      cancelled: { $ifNull: ['$$group.cancelled', false] }
                    }
                  }
                }
              }
            }
          },
          // Sort by event start date (newest first)
          { $sort: { 'event.startDateTime': -1 } },
          // Project the final shape
          {
            $project: {
              _id: 0,
              event: {
                _id: '$_id',
                title: '$event.title',
                imageUrl: '$event.imageUrl',
                startDateTime: '$event.startDateTime',
                endDateTime: '$event.endDateTime',
                organizer: '$event.organizer'
              },
              orderIds: 1,
              // Flatten and filter registrations array
              registrations: {
                $reduce: {
                  input: '$registrations',
                  initialValue: [],
                  in: { $concatArrays: ['$$value', '$$this'] }
                }
              }
            }
          }
        ]);

        return JSON.parse(JSON.stringify(aggregatedOrders));
      },
      ['orders-by-phone', phoneNumber],
      {
        revalidate: 30, // Cache for 30 seconds
        tags: ['orders', `phone-${phoneNumber}`]
      }
    )();
  } catch (error) {
    console.error('Error in aggregateOrdersByPhoneNumber:', error);
    throw error;
  }
};
