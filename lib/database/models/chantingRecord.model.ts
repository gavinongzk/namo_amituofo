import { Schema, model, models } from "mongoose";

const ChantingRecordSchema = new Schema({
  userId: { type: String, required: true },
  date: { type: Date, required: true },
  count: { type: Number, required: true, min: 0 },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create a compound index for userId and date to ensure unique daily records per user
ChantingRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

const ChantingRecord = models.ChantingRecord || model('ChantingRecord', ChantingRecordSchema);

export default ChantingRecord; 