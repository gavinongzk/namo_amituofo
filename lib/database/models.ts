// Import all models explicitly to ensure proper module resolution
import Event from './models/event.model';
import Order from './models/order.model';
import User from './models/user.model';
import Category from './models/category.model';
import TaggedUser from './models/taggedUser.model';
import QueueCounter from './models/queueCounter.model';

// Export all models
export {
  Event,
  Order,
  User,
  Category,
  TaggedUser,
  QueueCounter
};

// Also export the interfaces that exist
export type { IEvent } from './models/event.model';
export type { IOrder, IOrderItem } from './models/order.model';
export type { ICategory } from './models/category.model';

// Re-export from the models index as well for compatibility
export * from './models/index';
