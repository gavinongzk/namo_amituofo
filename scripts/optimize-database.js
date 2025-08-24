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
    await db.collection('events').createIndex(
      { country: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 },
      { background: true }
    );

    await db.collection('events').createIndex(
      { country: 1, category: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 },
      { background: true }
    );

    await db.collection('events').createIndex(
      { title: 'text' },
      { background: true }
    );

    await db.collection('events').createIndex(
      { startDateTime: -1, createdAt: -1 },
      { background: true }
    );

    await db.collection('events').createIndex(
      { organizer: 1 },
      { background: true }
    );

    await db.collection('events').createIndex(
      { isDeleted: 1 },
      { background: true }
    );

    await db.collection('events').createIndex(
      { isDraft: 1 },
      { background: true }
    );

    await db.collection('events').createIndex(
      { endDateTime: 1 },
      { background: true }
    );

    // Order collection indexes
    await db.collection('orders').createIndex(
      { event: 1 },
      { background: true }
    );

    await db.collection('orders').createIndex(
      { 'customFieldValues.fields.value': 1 },
      { background: true }
    );

    await db.collection('orders').createIndex(
      { 'customFieldValues.queueNumber': 1 },
      { background: true }
    );

    await db.collection('orders').createIndex(
      { 'customFieldValues.groupId': 1 },
      { background: true }
    );

    await db.collection('orders').createIndex(
      { event: 1, 'customFieldValues.queueNumber': 1 },
      { 
        unique: true,
        partialFilterExpression: { 'customFieldValues.queueNumber': { $exists: true } },
        background: true
      }
    );

    await db.collection('orders').createIndex(
      { 
        event: 1, 
        'customFieldValues.fields.value': 1, 
        'customFieldValues.queueNumber': 1 
      },
      { background: true }
    );

    await db.collection('orders').createIndex(
      { 'customFieldValues.fields.type': 1, 'customFieldValues.fields.value': 1 },
      { background: true }
    );

    await db.collection('orders').createIndex(
      { createdAt: -1 },
      { background: true }
    );

    await db.collection('orders').createIndex(
      { 'customFieldValues.cancelled': 1 },
      { background: true }
    );

    await db.collection('orders').createIndex(
      { 'customFieldValues.attendance': 1 },
      { background: true }
    );

    // User collection indexes
    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true, background: true }
    );

    // Category collection indexes
    await db.collection('categories').createIndex(
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
      const stats = await db.collection(collectionName).stats();
      console.log(`\n${collectionName}:`);
      console.log(`  - Documents: ${stats.count}`);
      console.log(`  - Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  - Indexes: ${stats.nindexes}`);
      console.log(`  - Total index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    }

    console.log('\nDatabase optimization completed successfully!');

  } catch (error) {
    console.error('Error optimizing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the optimization
if (require.main === module) {
  optimizeDatabase();
}

module.exports = { optimizeDatabase };
