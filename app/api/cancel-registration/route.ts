import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Order, Event } from '@/lib/database/models';
import { revalidateTag } from 'next/cache';
import { CustomFieldGroup, CustomField } from '@/types';

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log('Cancel/Uncancel registration request received');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  try {
    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    await connectToDatabase();

    const { eventId, queueNumber, cancelled } = await req.json();
    
    // Ensure cancelled is a boolean
    const cancelledBoolean = !!cancelled;
    
    console.log(`Cancel request params: eventId=${eventId || 'N/A'}, queueNumber=${queueNumber || 'N/A'}, cancelled=${cancelledBoolean} (${typeof cancelledBoolean})`);
    
    // Require queueNumber for cancellation operations
    if (!queueNumber) {
      console.error(`Cancel request denied: queueNumber is required`);
      return NextResponse.json({ 
        error: 'queueNumber is required for cancellation operations' 
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Require eventId
    if (!eventId) {
      console.error(`Cancel request denied: eventId is required`);
      return NextResponse.json({ 
        error: 'eventId is required for cancellation operations' 
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // First verify the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.error(`Event not found with ID: ${eventId}`);
      return NextResponse.json({ error: 'Event not found' }, { 
        status: 404,
        headers: corsHeaders
      });
    }
    
    console.log(`Found event ${eventId}, searching for queueNumber ${queueNumber}`);
    
    // Use atomic findOneAndUpdate to prevent race conditions
    // Try multiple queue number formats to handle potential inconsistencies
    const updateResult = await Order.findOneAndUpdate(
      { 
        event: eventId,
        $or: [
          { "customFieldValues.queueNumber": queueNumber },
          { "customFieldValues.queueNumber": String(queueNumber) },
          { "customFieldValues.queueNumber": Number(queueNumber) },
          { "customFieldValues.queueNumber": queueNumber.toString().padStart(3, '0') },
          { "customFieldValues.queueNumber": queueNumber.toString().replace(/^0+/, '') }
        ]
      },
      { 
        $set: { 
          "customFieldValues.$.cancelled": cancelledBoolean,
          "customFieldValues.$.lastUpdated": new Date()
        } 
      },
      { 
        new: true, // Return the updated document
        runValidators: true
      }
    );
    
    if (!updateResult) {
      console.error(`No registration found with queueNumber ${queueNumber} for event ${eventId}`);
      return NextResponse.json({ 
        error: 'Registration not found with provided queueNumber for this event' 
      }, { 
        status: 404,
        headers: corsHeaders
      });
    }

    console.log(`Successfully updated registration with queueNumber: ${queueNumber}`);

    // Find the updated group to verify the change
    const updatedGroup = updateResult.customFieldValues.find(
      (g: any) => {
        // Compare queue numbers with multiple formats
        const groupQueueNumber = String(g.queueNumber);
        const searchQueueNumber = String(queueNumber);
        return groupQueueNumber === searchQueueNumber ||
               groupQueueNumber === searchQueueNumber.padStart(3, '0') ||
               groupQueueNumber.replace(/^0+/, '') === searchQueueNumber.replace(/^0+/, '');
      }
    );

    if (updatedGroup) {
      console.log(`Verified update - group.cancelled: ${updatedGroup.cancelled} (${typeof updatedGroup.cancelled})`);
      
      // Update event's max seats atomically
      // Only update if the cancelled status actually changed
      if (updatedGroup.cancelled === cancelledBoolean) {
        const seatChange = cancelledBoolean ? 1 : -1;
        await Event.findByIdAndUpdate(
          eventId,
          { $inc: { maxSeats: seatChange } },
          { runValidators: true }
        );
        console.log(`Updated event maxSeats by ${seatChange}`);
      }
    }

    // CRITICAL: Ensure cache is properly invalidated to prevent stale data
    revalidateTag('order-details');
    revalidateTag('orders');
    revalidateTag('events');
    revalidateTag(`order-${updateResult._id}`);
    revalidateTag(`event-${eventId}`);
    revalidateTag('registrations');

    return NextResponse.json({ 
      message: cancelledBoolean ? 'Registration cancelled successfully' : 'Registration uncancelled successfully',
      cancelled: cancelledBoolean,
      queueNumber: queueNumber,
      eventId: eventId,
      updatedGroup: updatedGroup
    }, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}
