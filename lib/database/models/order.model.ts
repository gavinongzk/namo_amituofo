import { Schema, model, models, Document } from 'mongoose';
import { CustomFieldGroup, CustomField } from '@/types';
import Event from '@/lib/database/models/event.model';
import User from '@/lib/database/models/user.model';

export interface IOrder extends Document {
  _id: string;
  createdAt: Date;
  event: {
    _id: string;
    title: string;
    imageUrl?: string;
    startDateTime?: Date;
    endDateTime?: Date;
    organizer?: { _id: string };
    location: string;
  };
  customFieldValues: CustomFieldGroup[];
}

export interface IOrderItem {
  _id: string;
  createdAt: Date;
  event: {
    _id: string;
    title: string;
    imageUrl: string;
    startDateTime: Date;
    endDateTime: Date;
    organizer?: { _id: string };
    location: string;
  };
  customFieldValues: CustomFieldGroup[];
}

const OrderSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: Event,
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: User,
  },
  customFieldValues: [
    {
      groupId: { type: String, required: true },
      fields: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          type: { type: String, required: true },
          value: { type: String },
        },
      ],
      queueNumber: { type: String, required: true },
      attendance: { type: Boolean, default: false },
      cancelled: { type: Boolean, default: false },
      qrCode: { type: String, default: '' },
      __v: { type: Number, default: 0 },
    },
  ],
});

// Add this index
OrderSchema.index({ 'customFieldValues.fields.value': 1 });
// Add indexes for queueNumber and groupId for better lookup performance
OrderSchema.index({ 'customFieldValues.queueNumber': 1 }); // Primary lookup key
OrderSchema.index({ 'customFieldValues.groupId': 1 }); // Secondary lookup key
OrderSchema.index({ 'event': 1, 'customFieldValues.queueNumber': 1 }); // Compound index for event+queueNumber lookups

export default models.Order || model<IOrder>('Order', OrderSchema);