import { connectToDatabase } from '../database';
import QueueCounter, { initializeQueueCounter } from '../database/models/queueCounter.model';

// Initialize the counter when the module is loaded
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await connectToDatabase();
    await initializeQueueCounter();
    isInitialized = true;
  }
}

export async function generateQueueNumber(eventId: string, prefix: string = ''): Promise<string> {
  await ensureInitialized();

  // Use findOneAndUpdate for atomic operation
  const counter = await QueueCounter.findOneAndUpdate(
    { eventId, prefix },
    { $inc: { lastNumber: 1 } },
    { 
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  if (!counter) {
    throw new Error('Failed to generate queue number');
  }

  // Format the queue number with leading zeros
  const paddedNumber = String(counter.lastNumber).padStart(3, '0');
  return `${prefix}${paddedNumber}`;
}

export async function getNextQueueNumber(eventId: string, prefix: string = ''): Promise<string> {
  await ensureInitialized();

  // Get the current counter without incrementing
  const counter = await QueueCounter.findOne({ eventId, prefix });
  const nextNumber = (counter?.lastNumber || 0) + 1;
  const paddedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}${paddedNumber}`;
}

export async function resetQueueCounter(eventId: string, prefix: string = ''): Promise<void> {
  await ensureInitialized();
  await QueueCounter.findOneAndUpdate(
    { eventId, prefix },
    { lastNumber: 0 },
    { upsert: true }
  );
} 