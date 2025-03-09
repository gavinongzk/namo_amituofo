import { Document, Schema, model, models } from "mongoose";

export interface ICategory extends Document {
  _id: string;
  name: string;
  isHidden: boolean;
}

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  isHidden: { type: Boolean, default: false }
})

const Category = models.Category || model('Category', CategorySchema);

export default Category;