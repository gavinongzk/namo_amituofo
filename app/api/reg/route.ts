import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Order from '@/lib/database/models/order.model';
import { getOrdersByPhoneNumber, getAllOrdersByPhoneNumberIncludingCancelled } from '@/lib/actions/order.actions';
import { auth } from '@clerk/nextjs';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const phoneNumber = req.nextUrl.searchParams.get('phoneNumber');
    const includeAllRegistrations = req.nextUrl.searchParams.get('includeAllRegistrations') === 'true';
    const includeOrderDetails = req.nextUrl.searchParams.get('includeOrderDetails') === 'true';
    const eventId = req.nextUrl.searchParams.get('eventId');

    if (!phoneNumber) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    // Check if user is superadmin when includeAllRegistrations is true
    const attachOrderDetails = async (formattedOrders: any[]) => {
      if (!includeOrderDetails) return formattedOrders;

      const filteredGroups = eventId
        ? formattedOrders.filter((group: any) => String(group?.event?._id) === eventId)
        : formattedOrders;

      const uniqueOrderIds = Array.from(
        new Set(
          filteredGroups.flatMap((group: any) =>
            Array.isArray(group?.orderIds) ? group.orderIds.map((id: any) => String(id)) : []
          )
        )
      );

      if (uniqueOrderIds.length === 0) {
        return filteredGroups.map((group: any) => ({ ...group, detailedOrders: [] }));
      }

      const orders = await Order.find({ _id: { $in: uniqueOrderIds } })
        .populate('event')
        .populate('buyer')
        .select('-__v')
        .lean();

      const ordersById = new Map(
        orders.map((order: any) => [String(order._id), order])
      );

      return filteredGroups.map((group: any) => ({
        ...group,
        detailedOrders: (group.orderIds || [])
          .map((id: any) => ordersById.get(String(id)))
          .filter(Boolean),
      }));
    };

    if (includeAllRegistrations) {
      const { sessionClaims } = auth();
      const role = sessionClaims?.role as string;
      
      if (role !== 'superadmin') {
        return NextResponse.json({ message: 'Unauthorized: Only superadmins can view all registrations' }, { status: 403 });
      }
      
      const formattedOrders = await getAllOrdersByPhoneNumberIncludingCancelled(phoneNumber);
      const responsePayload = await attachOrderDetails(formattedOrders);
      
      // Set cache control headers to prevent caching
      const response = NextResponse.json(responsePayload);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    } else {
      // For normal lookup, filter out cancelled registrations
      const formattedOrders = await getOrdersByPhoneNumber(phoneNumber);
      const responsePayload = await attachOrderDetails(formattedOrders);
      
      // Set cache control headers to prevent caching
      const response = NextResponse.json(responsePayload);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
