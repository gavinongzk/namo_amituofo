"use server"

import { CreateOrderParams, GetOrdersByEventParams, GetOrdersByUserParams, CreateOrderActionParams } from "@/types" // Updated types import
import { handleError } from '../utils';
import { connectToDatabase } from '../database';
import Order from '../database/models/order.model';
import Event from '../database/models/event.model';
import UserDetails from '../database/models/userDetails.model';
import Category from '../database/models/category.model';
import {ObjectId} from 'mongodb';
import { IOrder, IOrderItem } from '../database/models/order.model';
import QRCode from 'qrcode';
import { CustomFieldGroup } from '@/types'
import { unstable_cache } from 'next/cache'
import { IUserDetails } from '../database/models/userDetails.model';

// --- User Verification Action ---
// This function is called by the API route *before* createOrder
export const verifyUserDetails = async ({ membershipNumber, last4PhoneNumberDigits }: {
  membershipNumber: string, last4PhoneNumberDigits: string
}): Promise<IUserDetails> => {
  await connectToDatabase();
  console.log(`Verifying user with membership: ${membershipNumber}`);

  if (!membershipNumber || !last4PhoneNumberDigits) {
    throw new Error('会员号码和电话号码最后4位数皆为必填 / Membership number and last 4 phone digits are required.');
  }
  if (last4PhoneNumberDigits.length !== 4 || !/^\\d{4}$/.test(last4PhoneNumberDigits)) {
    throw new Error('电话号码最后4位数格式无效 / Invalid format for last 4 phone digits.');
  }

  const userDetails = await UserDetails.findOne({ membershipNumber });

  if (!userDetails) {
    console.warn(`Membership number not found: ${membershipNumber}`);
    throw new Error(`找不到此会员号码 / Membership number ${membershipNumber} not found.`);
  }

  // Verify last 4 digits against the masked phone number
  const expectedSuffix = last4PhoneNumberDigits;
  // Extract last 4 digits from maskedPhoneNumber (e.g., '****1234')
  const actualSuffix = userDetails.maskedPhoneNumber.slice(-4);

  if (actualSuffix !== expectedSuffix) {
    console.warn(`Phone number mismatch for membership ${membershipNumber}. Expected ending: ${expectedSuffix}, Found in DB: ****${actualSuffix}`);
    throw new Error('电话号码验证失败，请检查最后4位数 / Phone number verification failed. Please check the last 4 digits.');
  }

  console.log(`User details verified for membership number: ${membershipNumber}`);
  // Return the full userDetails object upon successful verification
  return userDetails;
};


// --- Create Order Action ---
// Updated function signature to accept verified registrant ID and optional QR data
export async function createOrder({ eventId, registrantDetailsId, customFieldValues, membershipNumberForQR }: CreateOrderActionParams) {
  try {
    await connectToDatabase();
    console.log("Creating order for event:", eventId, "Registrant ID:", registrantDetailsId);

    if (!ObjectId.isValid(eventId) || !ObjectId.isValid(registrantDetailsId)) {
      console.error("Invalid eventId or registrantDetailsId", { eventId, registrantDetailsId });
      throw new Error('无效的活动ID或注册者ID / Invalid eventId or registrantDetailsId');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('找不到活动 / Event not found');
    }

    // Removed the user lookup/verification logic as it's done prior in verifyUserDetails

    // Count only uncancelled registrations for this event
    const currentRegistrations = await Order.aggregate([
      { $match: { event: new ObjectId(eventId) } },
      { $unwind: "$customFieldValues" },
      { $match: { "customFieldValues.cancelled": { $ne: true } } },
      { $count: "total" }
    ]);

    const totalRegistrations = currentRegistrations[0]?.total || 0;

    if (event.maxSeats !== undefined && totalRegistrations >= event.maxSeats) {
      console.warn("Event fully booked", { eventId, totalRegistrations, maxSeats: event.maxSeats });
      throw new Error('活动已满员 / Event is fully booked');
    }

    // Find the last order for this event to determine the next queue number
    const lastOrderAggregate = await Order.aggregate([
      { $match: { event: new ObjectId(eventId) } },
      { $unwind: "$customFieldValues" },
      { $sort: { "customFieldValues.queueNumber": -1 } }, // Sort by queue number descending
      { $limit: 1 },
      { $project: { _id: 0, lastQueueNumber: "$customFieldValues.queueNumber" } } // Project only the queue number
    ]);

    let lastQueueNumber = 0;
    if (lastOrderAggregate.length > 0 && lastOrderAggregate[0].lastQueueNumber) {
        // Extract numeric part, assuming format like 'XXX'
        const numericPart = parseInt(lastOrderAggregate[0].lastQueueNumber, 10);
        if (!isNaN(numericPart)) {
            lastQueueNumber = numericPart;
        }
    }
    console.log("Last queue number found:", lastQueueNumber);

    // Process customFieldValues, generate queue numbers and QR codes
    const newCustomFieldValues = await Promise.all(customFieldValues.map(async (group, index) => {
      const newNumericQueueNumber = lastQueueNumber + index + 1;
      const newQueueNumber = `${newNumericQueueNumber.toString().padStart(3, '0')}`;
      console.log("Generating queue number:", newQueueNumber);

      // --- Update QR Code Data ---
      // Use membershipNumberForQR passed from the API route
      const qrCodeData = `${eventId}_${newQueueNumber}_${membershipNumberForQR || 'N/A'}`;
      const qrCode = await QRCode.toDataURL(qrCodeData);
      console.log("Generated QR code for:", qrCodeData);
      // --- End Update QR Code Data ---

      return {
        ...group,
        queueNumber: newQueueNumber,
        qrCode: qrCode,
        cancelled: false,
        attendance: false, // Ensure attendance is initialized
        __v: 0,
      };
    }));

    // Create the new order, linking the verified registrantDetailsId
    const newOrder = await Order.create({
      event: new ObjectId(eventId),
      registrantDetails: new ObjectId(registrantDetailsId), // Use the verified ID
      createdAt: new Date(),
      customFieldValues: newCustomFieldValues,
      // buyer: null, // Explicitly set buyer to null or handle if Clerk user ID is available
    });

    console.log("New order created successfully:", newOrder._id);
    return JSON.parse(JSON.stringify(newOrder));

  } catch (error) {
    console.error('Error in createOrder action:', error);
    // Re-throw the error so the API route can catch and handle it
    // Potentially wrap in a custom error or just re-throw
    handleError(error); // Use existing error handler if appropriate
    // Or just: throw error;
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
