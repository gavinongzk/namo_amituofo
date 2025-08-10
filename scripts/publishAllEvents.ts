import { connectToDatabase } from '../lib/database';
import Event from '../lib/database/models/event.model';

async function publishAllEvents() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Set isDraft=false for any event where it's missing or not already false
    const filter = {
      $or: [
        { isDraft: { $exists: false } },
        { isDraft: { $ne: false } },
      ],
    } as any;

    const update = { $set: { isDraft: false } } as any;

    const result = await Event.updateMany(filter, update, { strict: false });
    console.log(`Updated ${result.modifiedCount ?? result.nModified ?? 0} event(s) to isDraft=false.`);

    // Optional: report totals
    const totals = await Event.aggregate([
      { $group: { _id: '$isDraft', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    console.log('Event counts by isDraft value:', totals);

    process.exit(0);
  } catch (err) {
    console.error('Error publishing all events:', err);
    process.exit(1);
  }
}

publishAllEvents();


