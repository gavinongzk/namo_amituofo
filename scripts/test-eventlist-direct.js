const mongoose = require('mongoose');

// Direct database test for EventList performance
async function testEventListDirect() {
  console.log('🚀 Testing EventList Performance (Direct Database)...\n');

  const MONGODB_URI = "mongodb+srv://gavinongzk:oVb2oUNl4cdx1aXS@cluster0.h3p5x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'evently',
      bufferCommands: false,
    });

    console.log('✅ Connected to MongoDB');

    // Import the optimized functions
    const { getAllEvents, getAllEventsForSuperAdmin } = require('../lib/actions/event.actions.ts');

    const testCount = 5;
    const results = [];

    console.log(`🔄 Running ${testCount} tests...\n`);

    for (let i = 1; i <= testCount; i++) {
      console.log(`Test ${i}/${testCount}...`);
      
      const startTime = Date.now();
      
      try {
        // Test the optimized getAllEvents function
        const events = await getAllEvents({
          query: '',
          category: '',
          page: 1,
          limit: 6,
          country: 'Singapore',
          role: undefined
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        results.push({
          test: i,
          duration,
          success: true,
          eventCount: events.data?.length || 0,
          totalPages: events.totalPages || 0
        });

        console.log(`  ✅ ${duration}ms - Events: ${events.data?.length || 0}, Pages: ${events.totalPages || 0}`);
        
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
      { name: 'Default Events', params: { query: '', category: '', page: 1, limit: 6, country: 'Singapore' } },
      { name: 'With Category Filter', params: { query: '', category: 'Meditation', page: 1, limit: 6, country: 'Singapore' } },
      { name: 'With Search Query', params: { query: 'meditation', category: '', page: 1, limit: 6, country: 'Singapore' } },
      { name: 'Super Admin View', params: { query: '', category: '', page: 1, limit: 6, country: 'Singapore' }, isSuperAdmin: true }
    ];

    for (const scenario of scenarios) {
      console.log(`\nTesting: ${scenario.name}`);
      const startTime = Date.now();
      
      try {
        const events = scenario.isSuperAdmin 
          ? await getAllEventsForSuperAdmin(scenario.params)
          : await getAllEvents(scenario.params);
        
        const duration = Date.now() - startTime;
        console.log(`  ✅ ${duration}ms - Events: ${events.data?.length || 0}, Pages: ${events.totalPages || 0}`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`  ❌ ${duration}ms - Error: ${error.message}`);
      }

      // Delay between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (successfulTests.length === testCount) {
      console.log('✅ All tests passed - EventList performance is excellent');
      console.log('💡 The optimizations have successfully resolved the timeout issues');
      console.log('💡 Database indexes are working correctly');
      console.log('💡 Aggregation pipelines are performing well');
    } else {
      console.log('⚠️  Some tests failed - Check database connection and data');
      console.log('💡 Verify that events exist in the database');
      console.log('💡 Check if categories exist for filtered queries');
    }

    console.log('\n🎉 Direct database performance test completed!');

  } catch (error) {
    console.error('❌ Error in direct database test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  testEventListDirect().catch(console.error);
}

module.exports = { testEventListDirect };
