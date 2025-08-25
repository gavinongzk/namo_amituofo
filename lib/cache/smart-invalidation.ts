import { revalidateTag, revalidatePath } from 'next/cache';

export class SmartCacheInvalidation {
  private static instance: SmartCacheInvalidation;
  private invalidationQueue: string[] = [];
  private pathInvalidationQueue: string[] = [];
  private isProcessing = false;
  private processingTimeout: NodeJS.Timeout | null = null;

  static getInstance(): SmartCacheInvalidation {
    if (!SmartCacheInvalidation.instance) {
      SmartCacheInvalidation.instance = new SmartCacheInvalidation();
    }
    return SmartCacheInvalidation.instance;
  }

  async queueInvalidation(tags: string[]): Promise<void> {
    this.invalidationQueue.push(...tags);
    
    if (!this.isProcessing) {
      this.scheduleProcessing();
    }
  }

  async queuePathInvalidation(paths: string[]): Promise<void> {
    this.pathInvalidationQueue.push(...paths);
    
    if (!this.isProcessing) {
      this.scheduleProcessing();
    }
  }

  private scheduleProcessing(): void {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }

    // Process after a short delay to batch multiple invalidations
    this.processingTimeout = setTimeout(() => {
      this.processQueue();
    }, 100);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Process tag invalidations in batches
      const tagBatchSize = 10;
      while (this.invalidationQueue.length > 0) {
        const batch = this.invalidationQueue.splice(0, tagBatchSize);
        
        // Process tag invalidations in parallel
        await Promise.all(
          batch.map(tag => {
            try {
              return revalidateTag(tag);
            } catch (error) {
              console.warn(`Failed to invalidate tag ${tag}:`, error);
              return Promise.resolve();
            }
          })
        );
        
        // Small delay between batches to prevent overwhelming the system
        if (this.invalidationQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Process path invalidations in batches
      const pathBatchSize = 5;
      while (this.pathInvalidationQueue.length > 0) {
        const batch = this.pathInvalidationQueue.splice(0, pathBatchSize);
        
        // Process path invalidations in parallel
        await Promise.all(
          batch.map(path => {
            try {
              return revalidatePath(path);
            } catch (error) {
              console.warn(`Failed to invalidate path ${path}:`, error);
              return Promise.resolve();
            }
          })
        );
        
        // Small delay between batches
        if (this.pathInvalidationQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error('Error processing cache invalidation queue:', error);
    } finally {
      this.isProcessing = false;
      this.processingTimeout = null;
    }
  }

  // Convenience methods for common invalidation patterns
  async invalidateEvent(eventId: string): Promise<void> {
    await this.queueInvalidation([
      `event-${eventId}`,
      'events',
      'api-events-list',
      'superadmin-events-list'
    ]);
    
    await this.queuePathInvalidation([
      '/',
      '/events',
      `/events/details/${eventId}`
    ]);
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.queueInvalidation([
      `user-${userId}`,
      'users',
      'user-registrations'
    ]);
  }

  async invalidateOrder(orderId: string): Promise<void> {
    await this.queueInvalidation([
      `order-${orderId}`,
      'orders',
      'order-details',
      'registrations'
    ]);
  }

  async invalidateAllEvents(): Promise<void> {
    await this.queueInvalidation([
      'events',
      'api-events-list',
      'superadmin-events-list',
      'admin-events'
    ]);
    
    await this.queuePathInvalidation([
      '/',
      '/events'
    ]);
  }

  // Get queue status for monitoring
  getQueueStatus(): { tagQueue: number; pathQueue: number; isProcessing: boolean } {
    return {
      tagQueue: this.invalidationQueue.length,
      pathQueue: this.pathInvalidationQueue.length,
      isProcessing: this.isProcessing
    };
  }

  // Clear all queues (useful for testing or emergency situations)
  clearQueues(): void {
    this.invalidationQueue = [];
    this.pathInvalidationQueue = [];
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    this.isProcessing = false;
  }
}

// Export singleton instance
export const smartInvalidation = SmartCacheInvalidation.getInstance();
