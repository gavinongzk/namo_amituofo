import { Document, Schema, model, models } from 'mongoose';

export interface IAutoEnrollProfile extends Document {
  _id: string;
  name: string;
  phoneNumber: string;
  postalCode?: string;
  country: string;
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AutoEnrollProfileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    postalCode: { type: String, default: '', trim: true },
    country: { type: String, required: true, enum: ['Singapore', 'Malaysia'] },
    enabled: { type: Boolean, default: true },
    createdBy: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

AutoEnrollProfileSchema.index({ country: 1, enabled: 1 });
AutoEnrollProfileSchema.index({ phoneNumber: 1, country: 1 });

const AutoEnrollProfile =
  models.AutoEnrollProfile || model<IAutoEnrollProfile>('AutoEnrollProfile', AutoEnrollProfileSchema);

export default AutoEnrollProfile;
