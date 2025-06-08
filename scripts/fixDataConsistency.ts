import { connectToDatabase } from '../lib/database';
import Order from '../lib/database/models/order.model';
import Event from '../lib/database/models/event.model';
import { ObjectId } from 'mongodb';

async function fixDataConsistency() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Get all events
    const events = await Event.find({ isDeleted: { $ne: true } });
    console.log(`Found ${events.length} events to process`);

    for (const event of events) {
      console.log(`\nProcessing event: ${event.title} (${event._id})`);

      // Get all orders for this event
      const orders = await Order.find({ event: event._id });
      console.log(`Found ${orders.length} orders for this event`);

      // Count uncancelled registrations
      let uncancelledCount = 0;
      let cancelledCount = 0;
      let duplicateQueueNumbers = new Set();
      let queueNumberMap = new Map();

      for (const order of orders) {
        for (const group of order.customFieldValues) {
          if (group.cancelled) {
            cancelledCount++;
          } else {
            uncancelledCount++;
          }

          // Check for duplicate queue numbers
          if (queueNumberMap.has(group.queueNumber)) {
            duplicateQueueNumbers.add(group.queueNumber);
            console.log(`⚠️  Duplicate queue number found: ${group.queueNumber}`);
          } else {
            queueNumberMap.set(group.queueNumber, order._id);
          }

          // Add lastUpdated field if missing
          if (!group.lastUpdated) {
            group.lastUpdated = order.createdAt || new Date();
          }

          // Ensure cancelled is boolean
          if (typeof group.cancelled !== 'boolean') {
            group.cancelled = !!group.cancelled;
          }

          // Ensure attendance is boolean
          if (typeof group.attendance !== 'boolean') {
            group.attendance = !!group.attendance;
          }

          // Reset attendance for cancelled registrations
          if (group.cancelled && group.attendance) {
            console.log(`⚠️  Resetting attendance for cancelled registration: ${group.queueNumber}`);
            group.attendance = false;
          }
        }

        // Save the order with updated fields
        await order.save();
      }

      // Calculate what maxSeats should be based on original capacity and cancellations
      const originalMaxSeats = event.maxSeats + cancelledCount - uncancelledCount;
      const expectedMaxSeats = originalMaxSeats + cancelledCount;

      console.log(`Event stats:`);
      console.log(`  - Uncancelled registrations: ${uncancelledCount}`);
      console.log(`  - Cancelled registrations: ${cancelledCount}`);
      console.log(`  - Current maxSeats: ${event.maxSeats}`);
      console.log(`  - Expected maxSeats: ${expectedMaxSeats}`);
      console.log(`  - Duplicate queue numbers: ${duplicateQueueNumbers.size}`);

      // Update maxSeats if it's incorrect
      if (event.maxSeats !== expectedMaxSeats) {
        console.log(`⚠️  Updating maxSeats from ${event.maxSeats} to ${expectedMaxSeats}`);
        await Event.findByIdAndUpdate(event._id, { maxSeats: expectedMaxSeats });
      }

      // Report duplicate queue numbers
      if (duplicateQueueNumbers.size > 0) {
        console.log(`⚠️  Found ${duplicateQueueNumbers.size} duplicate queue numbers:`, Array.from(duplicateQueueNumbers));
      }
    }

    console.log('\n✅ Data consistency check completed');
  } catch (error) {
    console.error('❌ Error fixing data consistency:', error);
    throw error;
  }
}

async function validateQueueNumberUniqueness() {
  try {
    await connectToDatabase();
    console.log('\n🔍 Validating queue number uniqueness...');

    const events = await Event.find({ isDeleted: { $ne: true } });

    for (const event of events) {
      const orders = await Order.find({ event: event._id });
      const queueNumbers = new Map();
      let duplicates = 0;

      for (const order of orders) {
        for (const group of order.customFieldValues) {
          const queueNumber = group.queueNumber;
          if (queueNumbers.has(queueNumber)) {
            console.log(`❌ Duplicate queue number ${queueNumber} in event ${event.title}`);
            console.log(`   First occurrence: Order ${queueNumbers.get(queueNumber)}`);
            console.log(`   Second occurrence: Order ${order._id}`);
            duplicates++;
          } else {
            queueNumbers.set(queueNumber, order._id);
          }
        }
      }

      if (duplicates === 0) {
        console.log(`✅ Event "${event.title}": All queue numbers are unique`);
      } else {
        console.log(`❌ Event "${event.title}": Found ${duplicates} duplicate queue numbers`);
      }
    }
  } catch (error) {
    console.error('❌ Error validating queue numbers:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting data consistency fix...');
    await fixDataConsistency();
    await validateQueueNumberUniqueness();
    console.log('🎉 All done!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { fixDataConsistency, validateQueueNumberUniqueness }; 