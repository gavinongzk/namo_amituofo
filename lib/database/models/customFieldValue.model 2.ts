import { Schema, model, models, Document } from 'mongoose';

export interface ICustomFieldValue extends Document {
  order: Schema.Types.ObjectId;
  groupId: string;
  fieldId: string;
  label: string;
  type: string;
  value: string;
  queueNumber: string;
  attendance: boolean;
}

const CustomFieldValueSchema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  groupId: {
    type: String,
    required: true
  },
  fieldId: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  queueNumber: {
    type: String,
    required: true
  },
  attendance: {
    type: Boolean,
    default: false
  }
});

const CustomFieldValue = models.CustomFieldValue || model<ICustomFieldValue>('CustomFieldValue', CustomFieldValueSchema);

export default CustomFieldValue;
