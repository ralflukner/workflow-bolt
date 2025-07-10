const { onRequest } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const Redis = require('redis');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Redis client instance
let redisClient = null;

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const projectId = process.env.PROJECT_ID || 'luknerlumina-firebase';
  const environment = process.env.ENVIRONMENT || 'prod';

  // Get Redis connection details from environment or Secret Manager
  let redisHost = process.env.REDIS_HOST;
  let redisPort = process.env.REDIS_PORT || 6379;
  let redisAuth = process.env.REDIS_AUTH;

  // If not in environment, get from Secret Manager
  if (!redisAuth) {
    try {
      const secretName = `projects/${projectId}/secrets/redis-auth-string-${environment}/versions/latest`;
      const [version] = await secretClient.accessSecretVersion({ name: secretName });
      redisAuth = version.payload.data.toString('utf8');
    } catch (error) {
      console.error('Failed to retrieve Redis auth from Secret Manager:', error);
    }
  }

  const redisUrl = `redis://${redisHost}:${redisPort}`;
  
  const redisOptions = {
    url: redisUrl,
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries) => {
        if (retries > 5) return new Error('Max retries reached');
        return Math.min(retries * 100, 3000);
      }
    }
  };

  if (redisAuth) {
    redisOptions.password = redisAuth;
  }

  redisClient = Redis.createClient(redisOptions);

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redisClient.connect();
  console.log('Redis client connected');

  return redisClient;
}

/**
 * Redis publish endpoint
 * Allows authenticated users to publish messages to Redis streams
 */
exports.redisPublish = onRequest(
  {
    cors: true,
    region: 'us-central1',
    maxInstances: 10,
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify Firebase authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Get request body
      const { stream, message } = req.body;

      if (!stream || !message) {
        res.status(400).json({ error: 'Missing stream or message' });
        return;
      }

      // Validate stream name (security check)
      const allowedStreams = [
        'tebra:requests',
        'agent_updates',
        'dev:workflow-bolt:stream'
      ];

      if (!allowedStreams.includes(stream)) {
        res.status(403).json({ error: 'Invalid stream name' });
        return;
      }

      // Add metadata to message
      const enrichedMessage = {
        ...message,
        _metadata: {
          publishedBy: userId,
          publishedAt: new Date().toISOString(),
          source: 'web-frontend'
        }
      };

      // Connect to Redis
      const redis = await initializeRedis();

      // Publish to stream
      const messageId = await redis.xAdd(stream, enrichedMessage);

      console.log(`Message published to ${stream}: ${messageId}`);

      // Return success
      res.json({
        success: true,
        messageId,
        stream,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Redis publish error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.ENVIRONMENT === 'dev' ? error.message : undefined
      });
    }
  }
); 