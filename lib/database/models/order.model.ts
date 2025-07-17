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
      lastUpdated: { type: Date, default: Date.now },
      __v: { type: Number, default: 0 },
    },
  ],
});

// Add this index
OrderSchema.index({ 'customFieldValues.fields.value': 1 });

// Add indexes for queueNumber and groupId for better lookup performance
OrderSchema.index({ 'customFieldValues.queueNumber': 1 }); // Primary lookup key
OrderSchema.index({ 'customFieldValues.groupId': 1 }); // Secondary lookup key

// Compound index for event+queueNumber lookups with uniqueness constraint
OrderSchema.index(
  { 'event': 1, 'customFieldValues.queueNumber': 1 },
  { 
    unique: true,
    partialFilterExpression: { 'customFieldValues.queueNumber': { $exists: true } }
  }
);

// Compound index for event+phone+queueNumber lookups
OrderSchema.index({ 
  'event': 1, 
  'customFieldValues.fields.value': 1, 
  'customFieldValues.queueNumber': 1 
});

// Add indexes for better query performance
OrderSchema.index({ event: 1, 'customFieldValues.queueNumber': 1 }, { unique: true });
OrderSchema.index({ 'customFieldValues.fields.type': 1, 'customFieldValues.fields.value': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'customFieldValues.cancelled': 1 });
OrderSchema.index({ 'customFieldValues.attendance': 1 });

// Add a pre-save hook to validate queue number uniqueness
OrderSchema.pre('save', async function(next) {
  try {
    const order = this;
    if (!order.isModified('customFieldValues')) {
      return next();
    }

    // Check for duplicate queue numbers within the same event
    const queueNumbers = order.customFieldValues.map(g => g.queueNumber);
    const uniqueQueueNumbers = new Set(queueNumbers);
    
    if (queueNumbers.length !== uniqueQueueNumbers.size) {
      throw new Error('Duplicate queue numbers found within the same order');
    }

    // Check for duplicate queue numbers across other orders in the same event
    for (const group of order.customFieldValues) {
      const existingOrder = await models.Order.findOne({
        _id: { $ne: order._id },
        event: order.event,
        'customFieldValues.queueNumber': group.queueNumber
      });

      if (existingOrder) {
        throw new Error(`Queue number ${group.queueNumber} already exists for this event`);
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export default models.Order || model<IOrder>('Order', OrderSchema);