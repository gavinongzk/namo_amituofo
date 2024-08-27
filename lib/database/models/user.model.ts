import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  phoneNumber: {type: String, required: true}
})

const User = models.User || model('User', UserSchema);

export default User;