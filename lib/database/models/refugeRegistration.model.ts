import { Schema, model, models, Document } from 'mongoose';

export interface IRefugeRegistration extends Document {
  createdAt: Date;
  chineseName: string;
  englishName: string;
  age: string;
  dob: string;
  gender: string;
  contactNumber: string;
  address: string;
  remarks?: string;
}

const RefugeRegistrationSchema = new Schema<IRefugeRegistration>({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  chineseName: {
    type: String,
    required: true,
  },
  englishName: {
    type: String,
    required: true,
  },
  age: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female'],
  },
  contactNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  remarks: {
    type: String,
    default: '',
  },
});

RefugeRegistrationSchema.index({ createdAt: -1 });

const RefugeRegistration = models.RefugeRegistration || model<IRefugeRegistration>('RefugeRegistration', RefugeRegistrationSchema);

export default RefugeRegistration;

