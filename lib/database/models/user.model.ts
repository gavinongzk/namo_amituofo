import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  phoneNumber: {type: String, required: true},
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' }
})

const User = models.User || model('User', UserSchema);

export default User;