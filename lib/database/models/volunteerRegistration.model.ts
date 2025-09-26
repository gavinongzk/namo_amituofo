import { Schema, model, models, Document } from 'mongoose';

export interface IVolunteerRegistration extends Document {
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

const VolunteerRegistrationSchema = new Schema<IVolunteerRegistration>({
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

VolunteerRegistrationSchema.index({ createdAt: -1 });
VolunteerRegistrationSchema.index({ 'customFieldValues.queueNumber': 1 });

const VolunteerRegistration = models.VolunteerRegistration || model<IVolunteerRegistration>('VolunteerRegistration', VolunteerRegistrationSchema);

export default VolunteerRegistration;


