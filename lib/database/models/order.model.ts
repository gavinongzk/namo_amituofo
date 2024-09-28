import { Schema, model, models, Document } from 'mongoose';

export interface CustomField {
  id: string;
  label: string;
  type: string;
  value: string;
}

export interface CustomFieldGroup {
  groupId: string;
  fields: CustomField[];
  queueNumber: string;
  attendance: boolean;
}

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
  };
  buyer: {
    _id: string;
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
    ref: 'Event',
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  customFieldValues: [
    {
      groupId: { type: String, required: true },
      fields: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          type: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      queueNumber: { type: String, required: true },
      attendance: { type: Boolean, default: false },
    },
  ],
});

// Add this index
OrderSchema.index({ 'customFieldValues.fields.value': 1 });

export default models.Order || model<IOrder>('Order', OrderSchema);
