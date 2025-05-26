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
    unique: true,
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

export default models.QueueCounter || model<IQueueCounter>('QueueCounter', QueueCounterSchema); 