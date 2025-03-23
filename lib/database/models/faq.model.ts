import { Document, Schema, model, models } from "mongoose";

export interface IFaq extends Document {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add timestamps for automatic createdAt and updatedAt handling
FAQSchema.set('timestamps', true);

const FAQ = models.FAQ || model<IFaq>('FAQ', FAQSchema);

export default FAQ; 