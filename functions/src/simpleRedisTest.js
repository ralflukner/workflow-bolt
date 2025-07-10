/**
 * Simple Redis connection test for local development
 * Tests connection to localhost Redis (not Cloud Memorystore)
 * Uses Redis v5+ modern async/await API
 */

const redis = require('redis');

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...');
  
  // Create Redis client for local development (Redis v5+ syntax)
  const client = redis.createClient({
    socket: {
      host: 'localhost',
      port: 6379,
      connectTimeout: 5000
    }
  });

  // Add error handler
  client.on('error', (err) => {
    console.error('❌ Redis client error:', err.message);
  });

  try {
    // Test basic connection
    console.log('⏳ Attempting to connect to Redis...');
    await client.connect();
    console.log('✅ Redis connected successfully');

    // Test ping
    console.log('⏳ Testing PING...');
    const pingResult = await client.ping();
    console.log('✅ Redis PING successful:', pingResult);

    // Test basic operations
    console.log('⏳ Testing read/write operations...');
    
    const testKey = 'test:firebase-functions:' + Date.now();
    const testValue = 'firebase-functions-test-' + Date.now();
    
    // Set with expiration
    await client.setEx(testKey, 30, testValue);
    console.log('✅ Redis SET successful');

    // Get value
    const retrievedValue = await client.get(testKey);
    console.log('✅ Redis GET successful:', retrievedValue);
    console.log('✅ Value matches:', retrievedValue === testValue ? 'YES' : 'NO');

    // Get Redis info
    console.log('⏳ Getting Redis server info...');
    const info = await client.info();

    // Parse basic Redis info
    const infoLines = info.split('\r\n');
    const redisInfo = {};
    infoLines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        redisInfo[key] = value;
      }
    });

    console.log('✅ Redis server info:');
    console.log('   Version:', redisInfo.redis_version);
    console.log('   Connected clients:', redisInfo.connected_clients);
    console.log('   Used memory:', redisInfo.used_memory_human);
    console.log('   Total commands processed:', redisInfo.total_commands_processed);

    // Clean up test key
    try {
      await client.del(testKey);
      console.log('✅ Test key cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️  Warning: Could not delete test key:', cleanupError.message);
    }

    // Close connection
    await client.quit();

    console.log('\n🎉 All Redis tests passed successfully!');
    console.log('✅ Firebase Functions can connect to and use Redis');
    
    return {
      success: true,
      message: 'Redis connection test successful',
      ping: pingResult,
      testValue: retrievedValue,
      redisVersion: redisInfo.redis_version,
      connectedClients: redisInfo.connected_clients,
      usedMemory: redisInfo.used_memory_human
    };

  } catch (error) {
    console.error('\n❌ Redis connection test failed:');
    console.error('   Error:', error.message);
    
    // Ensure client is closed
    try {
      client.quit();
    } catch (closeError) {
      console.error('   Additional error closing client:', closeError.message);
    }

    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Ensure Redis is running: redis-server');
    console.log('   2. Check Redis is listening on port 6379: redis-cli ping');
    console.log('   3. Verify no firewall blocking localhost:6379');
    
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRedisConnection()
    .then((result) => {
      console.log('\n✨ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed');
      process.exit(1);
    });
}

module.exports = { testRedisConnection };