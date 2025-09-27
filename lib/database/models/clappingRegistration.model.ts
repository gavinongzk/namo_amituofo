import { Schema, model, models, Document } from 'mongoose';

export interface IClappingRegistration extends Document {
  createdAt: Date;
  customFieldValues: Array<{
    groupId: string;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      value?: string | boolean;
    }>;
    queueNumber: string;
    attendance: boolean;
    cancelled: boolean;
    qrCode: string;
    lastUpdated: Date;
    __v?: number;
  }>;
}

const ClappingRegistrationSchema = new Schema<IClappingRegistration>({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  customFieldValues: [
    {
      groupId: { type: String, required: true },
      fields: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          type: { type: String, required: true },
          value: { type: Schema.Types.Mixed },
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

ClappingRegistrationSchema.index({ createdAt: -1 });
ClappingRegistrationSchema.index({ 'customFieldValues.queueNumber': 1 });

const ClappingRegistration = models.ClappingRegistration || model<IClappingRegistration>('ClappingRegistration', ClappingRegistrationSchema);

export default ClappingRegistration;


