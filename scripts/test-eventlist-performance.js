const https = require('https');
const http = require('http');

// Performance testing script for EventList retrieval
async function testEventListPerformance() {
  console.log('🚀 Testing EventList Performance...\n');

  // Configuration
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const testCount = 5;
  const results = [];

  console.log(`📍 Testing against: ${baseUrl}`);
  console.log(`🔄 Running ${testCount} tests...\n`);

  for (let i = 1; i <= testCount; i++) {
    console.log(`Test ${i}/${testCount}...`);
    
    const startTime = Date.now();
    
    try {
      const response = await makeRequest(`${baseUrl}/api/events?country=Singapore`);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        test: i,
        duration,
        status: response.status,
        success: response.status === 200,
        dataSize: response.data ? JSON.stringify(response.data).length : 0,
        eventCount: response.data?.data?.length || 0
      });

      console.log(`  ✅ ${duration}ms - Status: ${response.status} - Events: ${response.data?.data?.length || 0}`);
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        test: i,
        duration,
        status: 'ERROR',
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
      console.log(`📦 Average data size: ${(successfulTests[0].dataSize / 1024).toFixed(2)}KB`);
      console.log(`📋 Average event count: ${successfulTests[0].eventCount}`);
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
      ? `Events: ${result.eventCount}, Size: ${(result.dataSize / 1024).toFixed(2)}KB`
      : `Error: ${result.error}`;
    console.log(`${status} Test ${result.test}: ${result.duration}ms - ${details}`);
  });

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (successfulTests.length === testCount) {
    console.log('✅ All tests passed - EventList performance is good');
    if (results[0].duration > 2000) {
      console.log('💡 Consider enabling Fluid Compute in Vercel for even better performance');
    }
  } else {
    console.log('⚠️  Some tests failed - Check server logs and database connection');
    console.log('💡 Verify MONGODB_URI is properly configured');
    console.log('💡 Check if database indexes are created');
  }

  console.log('\n🎉 Performance test completed!');
}

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout after 30 seconds'));
    });
  });
}

// Test different scenarios
async function testMultipleScenarios() {
  console.log('🧪 Testing Multiple Scenarios...\n');

  const scenarios = [
    { name: 'Default Events', url: '/api/events?country=Singapore' },
    { name: 'With Category Filter', url: '/api/events?country=Singapore&category=Meditation' },
    { name: 'With Search Query', url: '/api/events?country=Singapore&query=meditation' },
    { name: 'Super Admin View', url: '/api/events?country=Singapore&role=superadmin' },
    { name: 'Cached Response', url: '/api/events?country=Singapore' } // Second call to test cache
  ];

  for (const scenario of scenarios) {
    console.log(`Testing: ${scenario.name}`);
    const startTime = Date.now();
    
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const response = await makeRequest(`${baseUrl}${scenario.url}`);
      const duration = Date.now() - startTime;
      
      console.log(`  ✅ ${duration}ms - Status: ${response.status} - Events: ${response.data?.data?.length || 0}`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`  ❌ ${duration}ms - Error: ${error.message}`);
    }

    // Delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--scenarios')) {
    await testMultipleScenarios();
  } else {
    await testEventListPerformance();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEventListPerformance, testMultipleScenarios };
