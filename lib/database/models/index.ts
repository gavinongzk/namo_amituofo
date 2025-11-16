// Import all models to ensure they are registered
import './user.model'
import './event.model'
import './order.model'
import './category.model'
import './taggedUser.model'
import './queueCounter.model'
import './refugeRegistration.model'

// Re-export all models with explicit imports to avoid build-time issues
import User from './user.model'
import Event from './event.model'
import Order from './order.model'
import Category from './category.model'
import TaggedUser from './taggedUser.model'
import QueueCounter from './queueCounter.model'
import RefugeRegistration from './refugeRegistration.model'

export {
  User,
  Event,
  Order,
  Category,
  TaggedUser,
  QueueCounter,
  RefugeRegistration
}

// Re-export interfaces
export type { IEvent } from './event.model'
export type { IOrder, IOrderItem } from './order.model'
export type { ICategory } from './category.model'
