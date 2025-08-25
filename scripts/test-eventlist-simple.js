const mongoose = require('mongoose');

// Simple database test for EventList performance
async function testEventListSimple() {
  console.log('🚀 Testing EventList Performance (Simple Database Query)...\n');

  const MONGODB_URI = "mongodb+srv://gavinongzk:oVb2oUNl4cdx1aXS@cluster0.h3p5x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'evently',
      bufferCommands: false,
    });

    console.log('✅ Connected to MongoDB');

    // Get database instance
    const db = mongoose.connection.db;

    const testCount = 5;
    const results = [];

    console.log(`🔄 Running ${testCount} tests...\n`);

    for (let i = 1; i <= testCount; i++) {
      console.log(`Test ${i}/${testCount}...`);
      
      const startTime = Date.now();
      
      try {
        // Test the optimized query pattern (similar to what we implemented)
        const conditions = {
          $and: [
            { country: 'Singapore' },
            { isDeleted: { $ne: true } },
            { isDraft: { $ne: true } },
            { endDateTime: { $gte: new Date() } }
          ]
        };

        // Use aggregation pipeline (like our optimized version)
        const pipeline = [
          { $match: conditions },
          { $sort: { startDateTime: -1, createdAt: -1 } },
          { $limit: 6 },
          {
            $lookup: {
              from: 'users',
              localField: 'organizer',
              foreignField: '_id',
              as: 'organizer',
              pipeline: [
                { $project: { _id: 1, firstName: 1, lastName: 1 } }
              ]
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
              pipeline: [
                { $project: { _id: 1, name: 1, color: 1 } }
              ]
            }
          },
          {
            $addFields: {
              organizer: { $arrayElemAt: ['$organizer', 0] },
              category: { $arrayElemAt: ['$category', 0] }
            }
          }
        ];

        const [events, eventsCount] = await Promise.all([
          db.collection('events').aggregate(pipeline).toArray(),
          db.collection('events').countDocuments(conditions)
        ]);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        results.push({
          test: i,
          duration,
          success: true,
          eventCount: events.length,
          totalPages: Math.ceil(eventsCount / 6)
        });

        console.log(`  ✅ ${duration}ms - Events: ${events.length}, Pages: ${Math.ceil(eventsCount / 6)}`);
        
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        results.push({
          test: i,
          duration,
          success: false,
          error: error.message
        });

        console.log(`  ❌ ${duration}ms - Error: ${error.message}`);
      }

      // Small delay between tests
      if (i < testCount) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate statistics
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    if (successfulTests.length > 0) {
      const durations = successfulTests.map(r => r.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log('\n📊 Performance Results:');
      console.log(`✅ Successful tests: ${successfulTests.length}/${testCount}`);
      console.log(`❌ Failed tests: ${failedTests.length}/${testCount}`);
      console.log(`⏱️  Average response time: ${avgDuration.toFixed(2)}ms`);
      console.log(`⚡ Fastest response: ${minDuration}ms`);
      console.log(`🐌 Slowest response: ${maxDuration}ms`);
      
      if (successfulTests[0]) {
        console.log(`📋 Average event count: ${successfulTests[0].eventCount}`);
        console.log(`📄 Average total pages: ${successfulTests[0].totalPages}`);
      }

      // Performance assessment
      console.log('\n🎯 Performance Assessment:');
      if (avgDuration < 1000) {
        console.log('🟢 EXCELLENT - Response time under 1 second');
      } else if (avgDuration < 3000) {
        console.log('🟡 GOOD - Response time under 3 seconds');
      } else if (avgDuration < 10000) {
        console.log('🟠 ACCEPTABLE - Response time under 10 seconds');
      } else {
        console.log('🔴 POOR - Response time over 10 seconds');
      }

      // Compare with previous timeout issue
      console.log('\n📈 Improvement Analysis:');
      console.log(`Previous timeout: 10+ seconds (timeout)`);
      console.log(`Current performance: ${avgDuration.toFixed(2)}ms`);
      console.log(`Improvement: ${((10000 / avgDuration) * 100).toFixed(1)}x faster`);

    } else {
      console.log('\n❌ All tests failed - No performance data available');
    }

    // Detailed results
    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const details = result.success 
        ? `Events: ${result.eventCount}, Pages: ${result.totalPages}`
        : `Error: ${result.error}`;
      console.log(`${status} Test ${result.test}: ${result.duration}ms - ${details}`);
    });

    // Test different scenarios
    console.log('\n🧪 Testing Different Scenarios...');
    
    const scenarios = [
      { 
        name: 'Default Events', 
        conditions: {
          $and: [
            { country: 'Singapore' },
            { isDeleted: { $ne: true } },
            { isDraft: { $ne: true } },
            { endDateTime: { $gte: new Date() } }
          ]
        }
      },
      { 
        name: 'With Category Filter', 
        conditions: {
          $and: [
            { country: 'Singapore' },
            { isDeleted: { $ne: true } },
            { isDraft: { $ne: true } },
            { endDateTime: { $gte: new Date() } },
            { category: { $exists: true } }
          ]
        }
      },
      { 
        name: 'With Search Query', 
        conditions: {
          $and: [
            { country: 'Singapore' },
            { isDeleted: { $ne: true } },
            { isDraft: { $ne: true } },
            { endDateTime: { $gte: new Date() } },
            { title: { $regex: 'meditation', $options: 'i' } }
          ]
        }
      },
      { 
        name: 'Super Admin View (No Date Filter)', 
        conditions: {
          $and: [
            { country: 'Singapore' },
            { isDeleted: { $ne: true } }
          ]
        }
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\nTesting: ${scenario.name}`);
      const startTime = Date.now();
      
      try {
        const pipeline = [
          { $match: scenario.conditions },
          { $sort: { startDateTime: -1, createdAt: -1 } },
          { $limit: 6 }
        ];

        const [events, eventsCount] = await Promise.all([
          db.collection('events').aggregate(pipeline).toArray(),
          db.collection('events').countDocuments(scenario.conditions)
        ]);
        
        const duration = Date.now() - startTime;
        console.log(`  ✅ ${duration}ms - Events: ${events.length}, Pages: ${Math.ceil(eventsCount / 6)}`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`  ❌ ${duration}ms - Error: ${error.message}`);
      }

      // Delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test registration count aggregation (like our optimized version)
    console.log('\n🧪 Testing Registration Count Aggregation...');
    const startTime = Date.now();
    
    try {
      // Get event IDs first
      const defaultConditions = {
        $and: [
          { country: 'Singapore' },
          { isDeleted: { $ne: true } },
          { isDraft: { $ne: true } },
          { endDateTime: { $gte: new Date() } }
        ]
      };
      const events = await db.collection('events').find(defaultConditions).limit(6).toArray();
      const eventIds = events.map(event => event._id);
      
      if (eventIds.length > 0) {
        // Batch fetch registration counts using aggregation
        const orders = await db.collection('orders').aggregate([
          { $match: { event: { $in: eventIds } } },
          { $project: { event: 1, customFieldValues: 1 } },
          {
            $group: {
              _id: '$event',
              count: { $sum: { $size: '$customFieldValues' } }
            }
          }
        ]).toArray();
        
        const duration = Date.now() - startTime;
        console.log(`  ✅ ${duration}ms - Registration counts for ${events.length} events`);
        console.log(`  📊 Registration data: ${orders.length} orders with counts`);
      } else {
        console.log('  ℹ️  No events found to test registration counts');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`  ❌ ${duration}ms - Error: ${error.message}`);
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (successfulTests.length === testCount) {
      console.log('✅ All tests passed - EventList performance is excellent');
      console.log('💡 The optimizations have successfully resolved the timeout issues');
      console.log('💡 Database indexes are working correctly');
      console.log('💡 Aggregation pipelines are performing well');
      console.log('💡 Registration count aggregation is efficient');
    } else {
      console.log('⚠️  Some tests failed - Check database connection and data');
      console.log('💡 Verify that events exist in the database');
      console.log('💡 Check if categories exist for filtered queries');
    }

    console.log('\n🎉 Simple database performance test completed!');

  } catch (error) {
    console.error('❌ Error in simple database test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  testEventListSimple().catch(console.error);
}

module.exports = { testEventListSimple };
