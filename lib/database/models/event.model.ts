import { Document, Schema, model, models } from "mongoose";

interface CustomField {
  id: string;
  label: string;
  type: string;
  value: string;
}

export interface IEvent extends Document {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  createdAt: Date;
  imageUrl: string;
  startDateTime: Date;
  endDateTime: Date;
  category: { _id: string, name: string }
  organizer: { _id: string }
  customFields?: CustomField[];
}

const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  createdAt: { type: Date, default: Date.now },
  imageUrl: { type: String, required: true },
  startDateTime: { type: Date, default: Date.now },
  endDateTime: { type: Date, default: Date.now },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  organizer: { type: Schema.Types.ObjectId, ref: 'User' },
  customFields: [{ // Add this field
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: String, required: false }
  }]
})

const Event = models.Event || model('Event', EventSchema);

export default Event;