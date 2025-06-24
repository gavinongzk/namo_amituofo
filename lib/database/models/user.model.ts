import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: {type: String},
  phoneNumber: {type: String},
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  region: { 
    type: String, 
    enum: ['Singapore', 'Malaysia-JB', 'Malaysia-KL'], 
    default: 'Singapore' 
  }
})

const User = models.User || model('User', UserSchema);

export default User;