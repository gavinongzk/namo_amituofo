import { connectToDatabase } from '../lib/database';
import Order from '../lib/database/models/order.model';
import QueueCounter from '../lib/database/models/queueCounter.model';
import { CustomFieldGroup } from '../types';

async function initializeQueueCounters() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Get all unique events
    const events = await Order.distinct('event');
    console.log(`Found ${events.length} events`);

    for (const eventId of events) {
      // Get all orders for this event
      const orders = await Order.find({ event: eventId });
      
      // Extract all queue numbers and find the maximum
      const queueNumbers = orders.flatMap(order => 
        order.customFieldValues.map((group: CustomFieldGroup) => {
          if (!group.queueNumber) return 0;
          const match = group.queueNumber.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        })
      );

      const maxQueueNumber = Math.max(0, ...queueNumbers);
      console.log(`Event ${eventId}: Max queue number = ${maxQueueNumber}`);

      // Initialize counter for regular queue numbers (no prefix)
      await QueueCounter.findOneAndUpdate(
        { eventId: eventId.toString(), prefix: '' },
        { lastNumber: maxQueueNumber },
        { upsert: true }
      );

      // Initialize counter for uploaded queue numbers (U prefix)
      const uploadedQueueNumbers = orders.flatMap(order =>
        order.customFieldValues
          .filter((group: CustomFieldGroup) => group.queueNumber && group.queueNumber.startsWith('U'))
          .map((group: CustomFieldGroup) => {
            if (!group.queueNumber) return 0;
            const match = group.queueNumber.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          })
      );

      const maxUploadedNumber = Math.max(0, ...uploadedQueueNumbers);
      console.log(`Event ${eventId}: Max uploaded queue number = ${maxUploadedNumber}`);

      await QueueCounter.findOneAndUpdate(
        { eventId: eventId.toString(), prefix: 'U' },
        { lastNumber: maxUploadedNumber },
        { upsert: true }
      );
    }

    console.log('Queue counters initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing queue counters:', error);
    process.exit(1);
  }
}

initializeQueueCounters(); 