import { Schema, model, models, Document } from 'mongoose'

export interface CustomField {
  id: string
  label: string
  type: string
  value: string
}

export interface IOrder extends Document {
  createdAt: Date
  event: {
    _id: string
    title: string
  }
  buyer: {
    _id: string
    firstName: string
    lastName: string
  }
  customFieldValues: CustomField[]
  queueNumber: string
  attendance: boolean
}

export type IOrderItem = {
  _id: string
  createdAt: Date
  eventTitle: string
  eventId: string
  buyer: string
  customFieldValues: CustomField[]
  queueNumber: string
  attendance: boolean
}

const OrderSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  customFieldValues: [
    {
      id: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, required: true },
      value: { type: String, required: true },
    },
  ],
  queueNumber: { type: String, required: true },
  attendance: { type: Boolean, default: false },
})

const Order = models.Order || model('Order', OrderSchema)

export default Order
