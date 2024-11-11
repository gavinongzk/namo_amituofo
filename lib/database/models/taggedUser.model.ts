import { Schema, model, models } from 'mongoose';

const TaggedUserSchema = new Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  remarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

const TaggedUser = models.TaggedUser || model('TaggedUser', TaggedUserSchema);

export default TaggedUser;
