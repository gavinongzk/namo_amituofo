import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: {type: String},
  phoneNumber: {type: String},
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  customLocation: { type: String },
})

const User = models.User || model('User', UserSchema);

export default User;