import { Document, Schema, model, models } from "mongoose";

export interface ICategory extends Document {
  _id: string;
  name: string;
  isHidden: boolean;
  color?: string;
  description?: string;
}

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  isHidden: { type: Boolean, default: false },
  color: { type: String, required: false },
  description: { type: String, required: false }
})

const Category = models.Category || model('Category', CategorySchema);

export default Category;