const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Event Schema (matching your model)
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  country: { type: String, required: true },
  location: { type: String },
  createdAt: { type: Date, default: Date.now },
  imageUrl: { type: String },
  startDateTime: { type: Date, default: Date.now },
  endDateTime: { type: Date, default: Date.now },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customFields: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: String, required: false }
  }],
  maxSeats: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false },
  isDraft: { type: Boolean, default: true }
});

// Add indexes for better query performance
EventSchema.index({ country: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 });
EventSchema.index({ country: 1, category: 1, isDeleted: 1, isDraft: 1, endDateTime: 1 });
EventSchema.index({ title: 'text' }); // Text search index
EventSchema.index({ startDateTime: -1, createdAt: -1 }); // Sort index
EventSchema.index({ organizer: 1 }); // Organizer lookup
EventSchema.index({ isDeleted: 1 }); // Soft delete filter
EventSchema.index({ isDraft: 1 }); // Draft filter
EventSchema.index({ endDateTime: 1 }); // Date filtering

const Event = mongoose.model('Event', EventSchema);

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB Connection and Events Schema...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing from .env.local');
    console.log('💡 Please add MONGODB_URI to your .env.local file');
    return;
  }

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'evently',
      bufferCommands: false,
    });
    console.log('✅ Successfully connected to MongoDB\n');

    // Test basic queries
    console.log('📊 Testing Events Collection Queries...\n');

    // 1. Count total events
    const totalEvents = await Event.countDocuments();
    console.log(`📈 Total events in database: ${totalEvents}`);

    // 2. Count non-deleted events
    const activeEvents = await Event.countDocuments({ isDeleted: false });
    console.log(`📈 Active events (not deleted): ${activeEvents}`);

    // 3. Count published events
    const publishedEvents = await Event.countDocuments({ 
      isDeleted: false, 
      isDraft: false 
    });
    console.log(`📈 Published events: ${publishedEvents}`);

    // 4. Get sample events
    const sampleEvents = await Event.find({ isDeleted: false })
      .limit(3)
      .select('title country location startDateTime maxSeats')
      .lean();
    
    console.log('\n📋 Sample Events:');
    if (sampleEvents.length > 0) {
      sampleEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title}`);
        console.log(`   Country: ${event.country}`);
        console.log(`   Location: ${event.location || 'N/A'}`);
        console.log(`   Date: ${event.startDateTime}`);
        console.log(`   Max Seats: ${event.maxSeats}`);
        console.log('');
      });
    } else {
      console.log('No events found');
    }

    // 5. Test aggregation pipeline
    console.log('🔍 Testing Aggregation Pipeline...');
    const eventStats = await Event.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
          avgSeats: { $avg: '$maxSeats' },
          totalSeats: { $sum: '$maxSeats' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('📊 Events by Country:');
    eventStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} events, avg ${Math.round(stat.avgSeats)} seats`);
    });

    // 6. Test text search
    console.log('\n🔍 Testing Text Search...');
    const searchResults = await Event.find(
      { $text: { $search: 'event' }, isDeleted: false },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(3)
    .select('title score')
    .lean();

    console.log('🔍 Text Search Results:');
    if (searchResults.length > 0) {
      searchResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title} (score: ${result.score})`);
      });
    } else {
      console.log('No text search results found');
    }

    // 7. Check indexes
    console.log('\n📋 Checking Indexes...');
    const indexes = await Event.collection.indexes();
    console.log(`Found ${indexes.length} indexes:`);
    indexes.forEach((index, i) => {
      const indexName = index.name || `index_${i}`;
      console.log(`  ${indexName}: ${JSON.stringify(index.key)}`);
    });

    // 8. Test performance
    console.log('\n⚡ Performance Test...');
    const startTime = Date.now();
    await Event.find({ isDeleted: false }).limit(10).lean();
    const queryTime = Date.now() - startTime;
    console.log(`Query execution time: ${queryTime}ms`);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if MongoDB is running');
      console.log('2. Verify your MONGODB_URI in .env.local');
      console.log('3. Check network connectivity');
      console.log('4. Verify database credentials');
    } else if (error.name === 'MongooseError') {
      console.log('\n💡 Mongoose-specific error. Check:');
      console.log('1. Database connection string format');
      console.log('2. Database permissions');
      console.log('3. Schema validation');
    }
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the test
testMongoDBConnection().catch(console.error);
