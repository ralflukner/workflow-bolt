/**
 * Cloud Function for automated Redis secret rotation
 * Triggered by Secret Manager rotation schedule via Pub/Sub
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { PubSub } = require('@google-cloud/pubsub');
const redis = require('redis');
const crypto = require('crypto');

// Initialize clients
const secretClient = new SecretManagerServiceClient();
const pubsub = new PubSub();

/**
 * Generate TOTP-compatible secret (base32 encoded)
 */
function generateTOTPSecret() {
  const buffer = crypto.randomBytes(20);
  return buffer.toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
    .toUpperCase()
    .substring(0, 32);
}

/**
 * Generate custom 2FA formula (10 random integers)
 */
function generateCustomFormula() {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 1000));
}

/**
 * Get secret value from Secret Manager
 */
async function getSecret(secretId, projectId) {
  const name = `projects/${projectId}/secrets/${secretId}/versions/latest`;
  const [response] = await secretClient.accessSecretVersion({ name });
  return response.payload.data.toString('utf8').trim();
}

/**
 * Update secret in Secret Manager
 */
async function updateSecret(secretId, value, projectId) {
  const parent = `projects/${projectId}/secrets/${secretId}`;
  await secretClient.addSecretVersion({
    parent,
    payload: {
      data: Buffer.from(value, 'utf8')
    }
  });
}

/**
 * Connect to Redis using current credentials
 */
async function connectRedis(projectId) {
  const redisPassword = await getSecret('redis-event-bus-pass', projectId);
  
  const client = redis.createClient({
    url: `redis://default:${redisPassword}@redis-16451.c280.us-central1-2.gce.redns.redis-cloud.com:16451`,
    socket: {
      tls: true,
      rejectUnauthorized: false
    }
  });
  
  await client.connect();
  return client;
}

/**
 * Rotate secrets for a specific user
 */
async function rotateUserSecrets(username, projectId, forceRotation = false) {
  try {
    // Get user configuration
    const configSecret = await getSecret(`redis-user-${username}-config`, projectId);
    const config = JSON.parse(configSecret);
    
    // Check if rotation is needed
    const nextRotation = new Date(config.next_rotation);
    const now = new Date();
    
    if (!forceRotation && now < nextRotation) {
      console.log(`Rotation not needed for ${username} until ${nextRotation}`);
      return { status: 'not_needed', nextRotation };
    }
    
    // Generate new secrets
    const newTOTPSecret = generateTOTPSecret();
    const newCustomFormula = generateCustomFormula();
    
    // Update configuration
    config.totp_secret = newTOTPSecret;
    config.custom_formula = newCustomFormula;
    config.last_rotation = now.toISOString();
    config.next_rotation = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString(); // +90 days
    
    // Store updated configuration
    await updateSecret(`redis-user-${username}-config`, JSON.stringify(config), projectId);
    
    // Log rotation event
    console.log(`✅ Rotated secrets for user: ${username}`);
    
    // Publish notification
    const topic = pubsub.topic('redis-secret-rotation');
    await topic.publishMessage({
      data: Buffer.from(JSON.stringify({
        event: 'secret_rotated',
        username,
        timestamp: now.toISOString(),
        next_rotation: config.next_rotation
      }))
    });
    
    return {
      status: 'rotated',
      username,
      nextRotation: config.next_rotation
    };
    
  } catch (error) {
    console.error(`❌ Failed to rotate secrets for ${username}:`, error);
    throw error;
  }
}

/**
 * Rotate all users due for rotation
 */
async function rotateAllDueUsers(projectId) {
  try {
    // Get users configuration
    const usersConfigSecret = await getSecret('redis-users-config', projectId);
    const usersConfig = JSON.parse(usersConfigSecret);
    
    const rotationResults = [];
    
    // Check each user
    for (const username of Object.keys(usersConfig.users || {})) {
      const userInfo = usersConfig.users[username];
      
      // Skip inactive users
      if (!userInfo.active) {
        continue;
      }
      
      try {
        const result = await rotateUserSecrets(username, projectId);
        rotationResults.push(result);
      } catch (error) {
        console.error(`Failed to rotate ${username}:`, error);
        rotationResults.push({
          status: 'error',
          username,
          error: error.message
        });
      }
    }
    
    return rotationResults;
    
  } catch (error) {
    console.error('Failed to rotate users:', error);
    throw error;
  }
}

/**
 * Emergency rotation for compromised user
 */
async function emergencyRotation(username, projectId) {
  console.log(`🚨 Emergency rotation triggered for user: ${username}`);
  
  // Mark as compromised
  const configSecret = await getSecret(`redis-user-${username}-config`, projectId);
  const config = JSON.parse(configSecret);
  
  config.compromised = true;
  config.compromised_at = new Date().toISOString();
  
  await updateSecret(`redis-user-${username}-config`, JSON.stringify(config), projectId);
  
  // Force rotation
  return await rotateUserSecrets(username, projectId, true);
}

/**
 * Main Cloud Function entry point
 */
exports.redisSecretRotator = async (message, context) => {
  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  
  try {
    console.log('🔄 Redis secret rotation triggered');
    console.log('Message:', message);
    console.log('Context:', context);
    
    // Parse message data
    let messageData = {};
    if (message.data) {
      messageData = JSON.parse(Buffer.from(message.data, 'base64').toString());
    }
    
    console.log('Message data:', messageData);
    
    // Determine rotation type
    if (messageData.username) {
      // Single user rotation
      if (messageData.emergency) {
        await emergencyRotation(messageData.username, projectId);
      } else {
        await rotateUserSecrets(messageData.username, projectId, messageData.force);
      }
    } else {
      // Bulk rotation of all due users
      await rotateAllDueUsers(projectId);
    }
    
    console.log('✅ Redis secret rotation completed successfully');
    
  } catch (error) {
    console.error('❌ Redis secret rotation failed:', error);
    throw error;
  }
};

/**
 * HTTP trigger for manual rotation
 */
exports.redisSecretRotatorHttp = async (req, res) => {
  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  
  try {
    const { username, force, emergency } = req.body || {};
    
    let result;
    if (username) {
      if (emergency) {
        result = await emergencyRotation(username, projectId);
      } else {
        result = await rotateUserSecrets(username, projectId, force);
      }
    } else {
      result = await rotateAllDueUsers(projectId);
    }
    
    res.status(200).json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('Rotation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};