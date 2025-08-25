const mongoose = require('mongoose');

// Database optimization script
async function optimizeDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('MONGODB_URI is missing');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: 'evently',
      bufferCommands: false,
    });

    console.log('Connected to MongoDB');

    // Get database instance
    const db = mongoose.connection.db;

    // Create indexes for better performance
    console.log('Creating/updating indexes...');

    // Event collection indexes
    await createIndexSafely(db.collection('events'), 
      { country: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('events'),
      { country: 1, category: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('events'),
      { title: 'text' },
      { background: true }
    );

    await createIndexSafely(db.collection('events'),
      { startDateTime: -1, createdAt: -1 },
      { background: true }
    );

    await createIndexSafely(db.collection('events'),
      { organizer: 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('events'),
      { isDeleted: 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('events'),
      { isDraft: 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('events'),
      { endDateTime: 1 },
      { background: true }
    );

    // Order collection indexes
    await createIndexSafely(db.collection('orders'),
      { event: 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('orders'),
      { 'customFieldValues.fields.value': 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('orders'),
      { 'customFieldValues.queueNumber': 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('orders'),
      { 'customFieldValues.groupId': 1 },
      { background: true }
    );

    // Handle the unique index carefully
    try {
      await db.collection('orders').createIndex(
        { event: 1, 'customFieldValues.queueNumber': 1 },
        { 
          unique: true,
          partialFilterExpression: { 'customFieldValues.queueNumber': { $exists: true } },
          background: true
        }
      );
      console.log('✅ Created unique index for event + queueNumber');
    } catch (error) {
      if (error.code === 86) {
        console.log('ℹ️  Unique index for event + queueNumber already exists');
      } else {
        throw error;
      }
    }

    await createIndexSafely(db.collection('orders'),
      { 
        event: 1, 
        'customFieldValues.fields.value': 1, 
        'customFieldValues.queueNumber': 1 
      },
      { background: true }
    );

    await createIndexSafely(db.collection('orders'),
      { 'customFieldValues.fields.type': 1, 'customFieldValues.fields.value': 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('orders'),
      { createdAt: -1 },
      { background: true }
    );

    await createIndexSafely(db.collection('orders'),
      { 'customFieldValues.cancelled': 1 },
      { background: true }
    );

    await createIndexSafely(db.collection('orders'),
      { 'customFieldValues.attendance': 1 },
      { background: true }
    );

    // User collection indexes
    await createIndexSafely(db.collection('users'),
      { email: 1 },
      { unique: true, background: true }
    );

    // Category collection indexes
    await createIndexSafely(db.collection('categories'),
      { name: 1 },
      { background: true }
    );

    console.log('All indexes created successfully');

    // Get index information
    console.log('\nIndex information:');
    
    const collections = ['events', 'orders', 'users', 'categories'];
    for (const collectionName of collections) {
      console.log(`\n${collectionName} collection indexes:`);
      const indexes = await db.collection(collectionName).indexes();
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }

    // Get collection statistics
    console.log('\nCollection statistics:');
    for (const collectionName of collections) {
      try {
        const stats = await db.collection(collectionName).stats();
        console.log(`\n${collectionName}:`);
        console.log(`  - Documents: ${stats.count}`);
        console.log(`  - Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  - Indexes: ${stats.nindexes}`);
        console.log(`  - Total index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
      } catch (error) {
        console.log(`\n${collectionName}: Error getting stats - ${error.message}`);
      }
    }

    console.log('\nDatabase optimization completed successfully!');

  } catch (error) {
    console.error('Error optimizing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Helper function to create indexes safely
async function createIndexSafely(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
    console.log(`✅ Created index: ${JSON.stringify(keys)}`);
  } catch (error) {
    if (error.code === 86) {
      console.log(`ℹ️  Index already exists: ${JSON.stringify(keys)}`);
    } else {
      console.error(`❌ Error creating index ${JSON.stringify(keys)}:`, error.message);
    }
  }
}

// Run the optimization
if (require.main === module) {
  optimizeDatabase();
}

module.exports = { optimizeDatabase };
