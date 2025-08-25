import { connectToDatabase } from '../lib/database/index';
import { Event, Order, User, Category } from '../lib/database/models/index';

export async function createOptimizedIndexes() {
  try {
    await connectToDatabase();
    console.log('Connected to database, creating optimized indexes...');
    
    // Event indexes for better query performance
    console.log('Creating Event indexes...');
    await Event.collection.createIndexes([
      // Main query index for event listings
      { key: { country: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 } },
      // Organizer events
      { key: { organizer: 1, createdAt: -1 } },
      // Category and date sorting
      { key: { category: 1, startDateTime: -1 } },
      // Search by title
      { key: { title: 'text' } },
      // Date range queries
      { key: { startDateTime: 1, endDateTime: 1 } }
    ]);
    
    // Order indexes for registration queries
    console.log('Creating Order indexes...');
    await Order.collection.createIndexes([
      // Event registrations
      { key: { event: 1, 'customFieldValues.cancelled': 1 } },
      // Phone number lookups
      { key: { 'customFieldValues.fields.type': 1, 'customFieldValues.fields.value': 1 } },
      // Queue number lookups
      { key: { 'customFieldValues.queueNumber': 1 } },
      // Attendance tracking
      { key: { event: 1, 'customFieldValues.attendance': 1 } },
      // Complex field queries
      { key: { 'customFieldValues.fields.label': 1, 'customFieldValues.fields.value': 1 } },
      // Date-based queries
      { key: { createdAt: -1 } }
    ]);
    
    // User indexes
    console.log('Creating User indexes...');
    await User.collection.createIndexes([
      // Role and country filtering
      { key: { role: 1, country: 1 } },
      // Email lookups
      { key: { email: 1 } },
      // Clerk user ID
      { key: { clerkId: 1 } }
    ]);
    
    // Category indexes
    console.log('Creating Category indexes...');
    await Category.collection.createIndexes([
      // Name lookups
      { key: { name: 1 } },
      // Hidden status
      { key: { isHidden: 1 } }
    ]);
    
    console.log('✅ All optimized indexes created successfully!');
    
    // Log index information
    console.log('\n📊 Index Summary:');
    
    const eventIndexes = await Event.collection.indexes();
    console.log(`Events: ${eventIndexes.length} indexes`);
    
    const orderIndexes = await Order.collection.indexes();
    console.log(`Orders: ${orderIndexes.length} indexes`);
    
    const userIndexes = await User.collection.indexes();
    console.log(`Users: ${userIndexes.length} indexes`);
    
    const categoryIndexes = await Category.collection.indexes();
    console.log(`Categories: ${categoryIndexes.length} indexes`);
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  createOptimizedIndexes()
    .then(() => {
      console.log('🎉 Index creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Index creation failed:', error);
      process.exit(1);
    });
}
