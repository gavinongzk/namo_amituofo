import { Schema, model, models, Document } from 'mongoose';

export interface IUserDetails extends Document {
  _id: string;
  name: string;
  phoneNumberHash: string;
  maskedPhoneNumber: string;
  maskedPostalCode?: string;
  membershipNumber?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserDetailsSchema = new Schema(
  {
    name: { type: String, required: true },
    // Store a hash of the phone number for secure lookup if needed in the future
    // For now, we primarily use membershipNumber for lookup
    phoneNumberHash: { type: String, required: true, unique: true, index: true },
    // Store masked phone number (e.g., ****1234) for verification
    maskedPhoneNumber: { type: String, required: true },
    maskedPostalCode: { type: String },
    // Membership number used for registration lookup
    membershipNumber: { type: String, unique: true, sparse: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

const UserDetails = models.UserDetails || model('UserDetails', UserDetailsSchema);

export default UserDetails;