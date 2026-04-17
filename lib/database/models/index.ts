// Import all models to ensure they are registered
import './user.model'
import './event.model'
import './order.model'
import './category.model'
import './taggedUser.model'
import './queueCounter.model'
import './refugeRegistration.model'
import './autoEnrollProfile.model'

// Re-export all models with explicit imports to avoid build-time issues
import User from './user.model'
import Event from './event.model'
import Order from './order.model'
import Category from './category.model'
import TaggedUser from './taggedUser.model'
import QueueCounter from './queueCounter.model'
import RefugeRegistration from './refugeRegistration.model'
import AutoEnrollProfile from './autoEnrollProfile.model'

export {
  User,
  Event,
  Order,
  Category,
  TaggedUser,
  QueueCounter,
  RefugeRegistration,
  AutoEnrollProfile
}

// Re-export interfaces
export type { IEvent } from './event.model'
export type { IOrder, IOrderItem } from './order.model'
export type { ICategory } from './category.model'
export type { IAutoEnrollProfile } from './autoEnrollProfile.model'
