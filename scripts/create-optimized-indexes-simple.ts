import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('Connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function createOptimizedIndexes() {
  try {
    await connectToDatabase();
    console.log('Creating optimized indexes...');
    
    // Ensure we have a database connection
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Event indexes for better query performance
    console.log('Creating Event indexes...');
    await mongoose.connection.db.collection('events').createIndexes([
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
    await mongoose.connection.db.collection('orders').createIndexes([
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
    await mongoose.connection.db.collection('users').createIndexes([
      // Role and country filtering
      { key: { role: 1, country: 1 } },
      // Email lookups
      { key: { email: 1 } },
      // Clerk user ID
      { key: { clerkId: 1 } }
    ]);
    
    // Category indexes
    console.log('Creating Category indexes...');
    await mongoose.connection.db.collection('categories').createIndexes([
      // Name lookups
      { key: { name: 1 } },
      // Hidden status
      { key: { isHidden: 1 } }
    ]);
    
    console.log('✅ All optimized indexes created successfully!');
    
    // Log index information
    console.log('\n📊 Index Summary:');
    
    const eventIndexes = await mongoose.connection.db.collection('events').indexes();
    console.log(`Events: ${eventIndexes.length} indexes`);
    
    const orderIndexes = await mongoose.connection.db.collection('orders').indexes();
    console.log(`Orders: ${orderIndexes.length} indexes`);
    
    const userIndexes = await mongoose.connection.db.collection('users').indexes();
    console.log(`Users: ${userIndexes.length} indexes`);
    
    const categoryIndexes = await mongoose.connection.db.collection('categories').indexes();
    console.log(`Categories: ${categoryIndexes.length} indexes`);
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createOptimizedIndexes()
  .then(() => {
    console.log('🎉 Index creation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Index creation failed:', error);
    process.exit(1);
  });
