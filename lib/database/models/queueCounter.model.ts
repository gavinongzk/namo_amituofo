import { Schema, model, models } from 'mongoose';

interface IQueueCounter {
  eventId: string;
  lastNumber: number;
  prefix: string;
}

const QueueCounterSchema = new Schema({
  eventId: {
    type: String,
    required: true,
  },
  lastNumber: {
    type: Number,
    default: 0,
  },
  prefix: {
    type: String,
    default: '',
  },
});

// Add compound index for eventId and prefix
QueueCounterSchema.index({ eventId: 1, prefix: 1 }, { unique: true });

// Initialize the model with a default counter if it doesn't exist
const initializeQueueCounter = async () => {
  try {
    const QueueCounter = models.QueueCounter || model<IQueueCounter>('QueueCounter', QueueCounterSchema);
    
    // Create a default counter if none exists
    await QueueCounter.findOneAndUpdate(
      { eventId: 'default', prefix: '' },
      { $setOnInsert: { lastNumber: 0 } },
      { upsert: true }
    );
    
    return QueueCounter;
  } catch (error) {
    console.error('Error initializing QueueCounter:', error);
    throw error;
  }
};

// Export both the model and initialization function
export { initializeQueueCounter };
export default models.QueueCounter || model<IQueueCounter>('QueueCounter', QueueCounterSchema); 