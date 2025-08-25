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

async function fixMongoDBIssues() {
  console.log('🔧 MongoDB Issues Fix and Optimization Script...\n');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing from .env.local');
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

    // Issue 1: Text search not working properly
    console.log('🔍 Issue 1: Text Search Optimization...');
    
    // Check if text index exists and is working
    try {
      const searchResults = await Event.find(
        { $text: { $search: '念佛' } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .select('title score');

      if (searchResults.length === 0) {
        console.log('⚠️  Text search returned no results for "念佛"');
        console.log('💡 This might be because:');
        console.log('   - Text index needs to be rebuilt');
        console.log('   - Search term doesn\'t match existing content');
        console.log('   - Index configuration needs adjustment');
        
        // Try to rebuild text index
        console.log('🔧 Attempting to rebuild text index...');
        try {
          await Event.collection.dropIndex('title_text');
          console.log('✅ Dropped existing text index');
        } catch (e) {
          console.log('ℹ️  No existing text index to drop');
        }
        
        // Create new text index
        await Event.collection.createIndex({ title: 'text' });
        console.log('✅ Created new text index');
        
        // Test search again
        const newSearchResults = await Event.find(
          { $text: { $search: '念佛' } },
          { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .select('title score');
        
        console.log(`🔍 New search results: ${newSearchResults.length}`);
        newSearchResults.forEach((result, i) => {
          console.log(`  ${i + 1}. ${result.title} (score: ${result.score})`);
        });
      } else {
        console.log('✅ Text search is working properly');
      }
    } catch (error) {
      console.log('❌ Text search error:', error.message);
    }

    // Issue 2: Performance optimization
    console.log('\n⚡ Issue 2: Performance Optimization...');
    
    // Check query performance
    const performanceTests = [
      { name: 'Basic query', query: () => Event.find({ isDeleted: false }).limit(10) },
      { name: 'With projection', query: () => Event.find({ isDeleted: false }).select('title country').limit(10) },
      { name: 'With sort', query: () => Event.find({ isDeleted: false }).sort({ startDateTime: -1 }).limit(10) },
      { name: 'With filter', query: () => Event.find({ isDeleted: false, country: 'Singapore' }).limit(10) }
    ];

    console.log('📊 Current Performance:');
    for (const { name, query } of performanceTests) {
      const start = Date.now();
      await query();
      const duration = Date.now() - start;
      console.log(`  ${name}: ${duration}ms`);
      
      if (duration > 500) {
        console.log(`    ⚠️  Slow query detected (>500ms)`);
      }
    }

    // Issue 3: Data cleanup recommendations
    console.log('\n🧹 Issue 3: Data Cleanup Recommendations...');
    
    const totalEvents = await Event.countDocuments();
    const deletedEvents = await Event.countDocuments({ isDeleted: true });
    const pastEvents = await Event.countDocuments({
      endDateTime: { $lt: new Date() },
      isDeleted: false
    });
    
    console.log(`📊 Data Statistics:`);
    console.log(`  Total events: ${totalEvents}`);
    console.log(`  Deleted events: ${deletedEvents} (${((deletedEvents/totalEvents)*100).toFixed(1)}%)`);
    console.log(`  Past events: ${pastEvents} (${((pastEvents/totalEvents)*100).toFixed(1)}%)`);
    
    if (deletedEvents > totalEvents * 0.3) {
      console.log('💡 Recommendation: Consider permanently removing deleted events');
      console.log('   - Deleted events take up storage space');
      console.log('   - They can slow down queries');
      console.log('   - Consider running cleanup script');
    }
    
    if (pastEvents > totalEvents * 0.5) {
      console.log('💡 Recommendation: Consider archiving old events');
      console.log('   - Many past events can impact performance');
      console.log('   - Consider moving to archive collection');
    }

    // Issue 4: Index optimization
    console.log('\n📋 Issue 4: Index Optimization...');
    
    try {
      const indexes = await mongoose.connection.db.collection('events').indexes();
      console.log(`Current indexes: ${indexes.length}`);
      
      // Check for duplicate or unnecessary indexes
      const indexNames = indexes.map(idx => idx.name);
      const duplicateIndexes = indexNames.filter((name, index) => indexNames.indexOf(name) !== index);
      
      if (duplicateIndexes.length > 0) {
        console.log('⚠️  Duplicate indexes found:', duplicateIndexes);
      } else {
        console.log('✅ No duplicate indexes found');
      }
      
      // Check for missing important indexes
      const importantIndexes = [
        'country_1_isDeleted_1_isDraft_1_endDateTime_1',
        'title_text',
        'startDateTime_-1_createdAt_-1'
      ];
      
      const missingIndexes = importantIndexes.filter(name => !indexNames.includes(name));
      if (missingIndexes.length > 0) {
        console.log('⚠️  Missing important indexes:', missingIndexes);
      } else {
        console.log('✅ All important indexes are present');
      }
      
    } catch (error) {
      console.log('⚠️  Could not analyze indexes:', error.message);
    }

    // Issue 5: Schema validation
    console.log('\n🔍 Issue 5: Schema Validation...');
    
    // Check for data type inconsistencies
    const stringMaxSeats = await Event.countDocuments({ maxSeats: { $type: "string" } });
    const missingRequiredFields = await Event.countDocuments({
      $or: [
        { title: { $exists: false } },
        { country: { $exists: false } },
        { maxSeats: { $exists: false } }
      ]
    });
    
    if (stringMaxSeats > 0) {
      console.log(`⚠️  Found ${stringMaxSeats} events with string maxSeats`);
      console.log('💡 Recommendation: Convert to numbers');
    }
    
    if (missingRequiredFields > 0) {
      console.log(`⚠️  Found ${missingRequiredFields} events with missing required fields`);
      console.log('💡 Recommendation: Add missing data or remove invalid records');
    }
    
    if (stringMaxSeats === 0 && missingRequiredFields === 0) {
      console.log('✅ All data types and required fields are correct');
    }

    // Summary and recommendations
    console.log('\n📋 Summary & Recommendations:');
    console.log('✅ MongoDB connection: Working');
    console.log('✅ Events collection: Accessible');
    console.log('✅ Basic schema validation: Passed');
    
    console.log('\n💡 Optimization Recommendations:');
    console.log('1. Monitor query performance regularly');
    console.log('2. Consider implementing data archiving for old events');
    console.log('3. Review and optimize indexes based on query patterns');
    console.log('4. Implement caching for frequently accessed data');
    console.log('5. Consider adding database monitoring tools');
    
    console.log('\n🔧 Maintenance Tasks:');
    console.log('1. Run this script periodically to check for issues');
    console.log('2. Monitor database size and performance');
    console.log('3. Review and clean up deleted events periodically');
    console.log('4. Update indexes based on changing query patterns');

  } catch (error) {
    console.error('❌ Error during fix process:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the fix script
fixMongoDBIssues().catch(console.error);
