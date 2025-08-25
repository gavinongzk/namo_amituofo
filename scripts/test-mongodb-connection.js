const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB connection and indexes...');
  
  try {
    // Test basic connection
    console.log('📡 Connecting to MongoDB...');
    console.log('🔑 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'evently',
      bufferCommands: false,
    });
    console.log('✅ MongoDB connected successfully');

    // Test Event collection
    console.log('\n📊 Testing Event collection...');
    const Event = mongoose.model('Event', new mongoose.Schema({}));
    const eventCount = await Event.countDocuments();
    console.log(`📈 Total events: ${eventCount}`);

    // Test Order collection
    console.log('\n📋 Testing Order collection...');
    const Order = mongoose.model('Order', new mongoose.Schema({}));
    const orderCount = await Order.countDocuments();
    console.log(`📈 Total orders: ${orderCount}`);

    // Check indexes
    console.log('\n🔍 Checking Event indexes...');
    const eventIndexes = await Event.collection.indexes();
    console.log('Event indexes:', eventIndexes.map(idx => idx.name));

    console.log('\n🔍 Checking Order indexes...');
    const orderIndexes = await Order.collection.indexes();
    console.log('Order indexes:', orderIndexes.map(idx => idx.name));

    // Test the specific query that might be failing
    console.log('\n🧪 Testing getAllEvents query...');
    const testQuery = {
      $and: [
        { country: 'Singapore' },
        { isDeleted: { $ne: true } },
        { isDraft: { $ne: true } },
        { endDateTime: { $gte: new Date() } }
      ]
    };
    
    const testEvents = await Event.find(testQuery).limit(5);
    console.log(`✅ Found ${testEvents.length} events with test query`);

    // Test aggregation pipeline
    console.log('\n🧪 Testing aggregation pipeline...');
    const pipeline = [
      { $match: testQuery },
      { $sort: { startDateTime: -1, createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
          foreignField: '_id',
          as: 'organizer',
          pipeline: [{ $project: { _id: 1, firstName: 1, lastName: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { _id: 1, name: 1, color: 1 } }]
        }
      }
    ];
    
    const aggregatedEvents = await Event.aggregate(pipeline);
    console.log(`✅ Aggregation returned ${aggregatedEvents.length} events`);

  } catch (error) {
    console.error('❌ Error during MongoDB test:', error);
    
    if (error.code === 11000) {
      console.error('🔴 Duplicate key error detected! This might be an index issue.');
    }
    
    if (error.message.includes('index')) {
      console.error('🔴 Index-related error detected!');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

testMongoDBConnection();
