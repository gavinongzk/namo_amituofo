// Export all models to avoid circular dependencies
export { default as Event } from './models/event.model';
export { default as Order } from './models/order.model';
export { default as User } from './models/user.model';
export { default as Category } from './models/category.model';
export { default as TaggedUser } from './models/taggedUser.model';
export { default as QueueCounter } from './models/queueCounter.model';

// Also export the interfaces that exist
export type { IEvent } from './models/event.model';
export type { IOrder } from './models/order.model';
export type { ICategory } from './models/category.model';
