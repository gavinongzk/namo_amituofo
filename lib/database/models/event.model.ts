import mongoose, { Document, Schema, model, models } from "mongoose";
import { CustomField } from "@/types";
import { eventDefaultValues } from "@/constants";

export interface IEvent extends Document {
  _id: string;
  title: string;
  description?: string;
  location: string;
  createdAt: Date;
  imageUrl?: string;
  startDateTime: Date;
  endDateTime: Date;
  category: { _id: string, name: string, color?: string }
  organizer: { _id: string }
  customFields: CustomField[];
  maxSeats: number;
  attendeeCount?: number;
  country: string;
  isDeleted: boolean;
  isDraft?: boolean;
}

const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  country: { type: String, required: true },
  location: { type: String },
  createdAt: { type: Date, default: Date.now },
  imageUrl: { type: String },
  startDateTime: { type: Date, default: Date.now },
  endDateTime: { type: Date, default: Date.now },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  organizer: { type: Schema.Types.ObjectId, ref: 'User' },
  customFields: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: String, required: false }
  }],
  maxSeats: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false },
  isDraft: { type: Boolean, default: true }
})

// Add indexes for better query performance
EventSchema.index({ country: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 });
EventSchema.index({ country: 1, category: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 });
EventSchema.index({ title: 'text' }); // Text search index
EventSchema.index({ startDateTime: -1, createdAt: -1 }); // Sort index
EventSchema.index({ organizer: 1 }); // Organizer lookup
EventSchema.index({ isDeleted: 1 }); // Soft delete filter
EventSchema.index({ isDraft: 1 }); // Draft filter
EventSchema.index({ endDateTime: 1 }); // Date filtering

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

export default Event;