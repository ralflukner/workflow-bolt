const functions = require('firebase-functions');
const redis = require('redis');

/**
 * Test Redis connection to Google Cloud Memorystore
 * This function uses the VPC connector to reach Redis on the private network
 */
exports.testRedisConnection = functions
  .runWith({
    vpcConnector: 'redis-connector',
    vpcConnectorEgressSettings: 'VPC_CONNECTOR_EGRESS_SETTINGS_PRIVATE_RANGES_ONLY'
  })
  .https.onCall(async (data, context) => {
    console.log('Testing Redis connection to Memorystore...');
    
    // Initialize Redis client for Memorystore
    const client = redis.createClient({
      host: '10.161.35.147',
      port: 6379,
      // No password needed for this Memorystore instance
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis connection timeout');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    try {
      // Test basic connection
      await new Promise((resolve, reject) => {
        client.on('connect', () => {
          console.log('✅ Redis connected successfully');
          resolve();
        });
        
        client.on('error', (err) => {
          console.error('❌ Redis connection error:', err);
          reject(err);
        });
      });

      // Test ping
      const pingResult = await new Promise((resolve, reject) => {
        client.ping((err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      
      console.log('✅ Redis PING successful:', pingResult);

      // Test basic operations
      await new Promise((resolve, reject) => {
        client.set('test:connection', 'success', 'EX', 30, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      const testValue = await new Promise((resolve, reject) => {
        client.get('test:connection', (err, value) => {
          if (err) {
            reject(err);
          } else {
            resolve(value);
          }
        });
      });

      console.log('✅ Redis read/write test successful:', testValue);

      // Get Redis info
      const info = await new Promise((resolve, reject) => {
        client.info((err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      // Parse Redis info
      const infoLines = info.split('\r\n');
      const redisInfo = {};
      infoLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          redisInfo[key] = value;
        }
      });

      console.log('✅ Redis info retrieved successfully');

      // Close connection
      client.quit();

      return {
        success: true,
        message: 'Redis connection test successful',
        ping: pingResult,
        testValue: testValue,
        redisVersion: redisInfo.redis_version,
        connectedClients: redisInfo.connected_clients,
        usedMemory: redisInfo.used_memory_human,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Redis connection test failed:', error);
      
      // Ensure client is closed
      try {
        client.quit();
      } catch (closeError) {
        console.error('Error closing Redis client:', closeError);
      }

      throw new functions.https.HttpsError(
        'internal',
        'Redis connection test failed',
        { error: error.message }
      );
    }
  });