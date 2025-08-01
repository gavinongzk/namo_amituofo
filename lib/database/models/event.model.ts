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
  isDeleted: { type: Boolean, default: false }
})

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

export default Event;