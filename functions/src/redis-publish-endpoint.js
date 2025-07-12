const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'https://luknerlumina-firebase.web.app',
    'https://luknerlumina-firebase.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Redis client
let redisClient;

// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'luknerlumina.auth0.com';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://api.luknerlumina.com';

// JWKS client for Auth0 token verification
const jwksClientInstance = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

// Verify Auth0 JWT token
async function verifyAuth0Token(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        jwksClientInstance.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          const signingKey = key.getPublicKey();
          callback(null, signingKey);
        });
      },
      {
        audience: AUTH0_AUDIENCE,
        issuer: `https://${AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
}

// Authentication middleware
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = await verifyAuth0Token(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Initialize Redis connection
async function initRedis() {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = process.env.REDIS_PORT || 6379;
  const redisPassword = process.env.REDIS_PASSWORD;

  redisClient = createClient({
    socket: {
      host: redisHost,
      port: redisPort
    },
    password: redisPassword
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Redis Client Connected'));

  await redisClient.connect();
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      res.json({ status: 'healthy', redis: 'connected' });
    } else {
      res.status(503).json({ status: 'unhealthy', redis: 'disconnected' });
    }
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// Main endpoint to publish Tebra requests to Redis
app.post('/api/tebra/:action', authenticate, async (req, res) => {
  const { action } = req.params;
  const requestId = uuidv4();
  
  // HIPAA Audit Log
  console.log('HIPAA_AUDIT:', JSON.stringify({
    type: 'TEBRA_API_REQUEST',
    action,
    userId: req.user.sub,
    requestId,
    timestamp: new Date().toISOString()
  }));

  try {
    // Prepare the message for Redis
    const message = {
      id: requestId,
      action,
      data: req.body,
      userId: req.user.sub,
      timestamp: Date.now()
    };

    // Publish to Redis stream
    await redisClient.xAdd(
      'tebra:requests',
      '*',
      {
        message: JSON.stringify(message)
      }
    );

    // Store request status
    await redisClient.hSet(`request:${requestId}`, {
      status: 'pending',
      action,
      userId: req.user.sub,
      timestamp: Date.now()
    });

    // Set expiration for request status (1 hour)
    await redisClient.expire(`request:${requestId}`, 3600);

    res.json({
      success: true,
      requestId,
      message: 'Request queued for processing'
    });

  } catch (error) {
    console.error('Redis publish error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue request'
    });
  }
});

// Endpoint to check request status
app.get('/api/status/:requestId', authenticate, async (req, res) => {
  const { requestId } = req.params;

  try {
    const status = await redisClient.hGetAll(`request:${requestId}`);
    
    if (!status || Object.keys(status).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Check if user owns this request
    if (status.userId !== req.user.sub) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get result if available
    const result = await redisClient.get(`result:${requestId}`);

    res.json({
      success: true,
      status: status.status,
      result: result ? JSON.parse(result) : null,
      timestamp: status.timestamp
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check status'
    });
  }
});

// Endpoint for scheduled operations (replaces scheduledCredentialCheck)
app.post('/api/scheduled/credential-check', async (req, res) => {
  // Verify this is from Cloud Scheduler
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('Google')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const message = {
      id: uuidv4(),
      action: 'credentialCheck',
      data: {},
      scheduled: true,
      timestamp: Date.now()
    };

    await redisClient.xAdd(
      'scheduled:tasks',
      '*',
      {
        message: JSON.stringify(message)
      }
    );

    res.json({ success: true, message: 'Credential check scheduled' });
  } catch (error) {
    console.error('Scheduled task error:', error);
    res.status(500).json({ error: 'Failed to schedule task' });
  }
});

// Start server
const PORT = process.env.PORT || 8080;

initRedis().then(() => {
  app.listen(PORT, () => {
    console.log(`Redis publish endpoint listening on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize Redis:', error);
  process.exit(1);
});

module.exports = app; 