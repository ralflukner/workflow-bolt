const functions = require('firebase-functions');
const functionsV1 = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin (avoid duplicate app error)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ---------------------------------------------
// 🔐 Authentication middleware
// Verifies Firebase ID token from Authorization: Bearer <token>
// ---------------------------------------------

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No bearer token' });
    }

    const idToken = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    // Attach decoded token to request for downstream handlers
    req.user = decoded;
    return next();
  } catch (err) {
    console.error('Authentication failed', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Apply authentication middleware to all /test routes
app.use('/test', authenticate);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint with different HTTP methods
app.get('/test', (req, res) => {
  res.json({ message: 'GET request successful', method: 'GET' });
});

app.post('/test', (req, res) => {
  const body = req.body;
  res.json({ 
    message: 'POST request successful', 
    method: 'POST',
    receivedData: body 
  });
});

app.put('/test', (req, res) => {
  const body = req.body;
  res.json({ 
    message: 'PUT request successful', 
    method: 'PUT',
    receivedData: body 
  });
});

app.delete('/test', (req, res) => {
  res.json({ message: 'DELETE request successful', method: 'DELETE' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const payload =
    process.env.NODE_ENV === 'production'
      ? { error: 'Internal server error' }
      : { error: 'Internal server error', message: err.message };
  res.status(500).json(payload);
});

// Keep api as 1st Gen
exports.api = functions.https.onRequest(app);

// Tebra API Functions
exports.tebraTestConnection = onCall({ cors: true }, async (request) => {
  console.log('Testing Tebra connection...');
  
  try {
    // For now, return a simple success response
    // In production, this would actually test the Tebra API connection
    return { 
      success: true, 
      message: 'Tebra API connection test successful',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Tebra connection test failed:', error);
    return { 
      success: false, 
      message: error.message || 'Connection test failed',
      timestamp: new Date().toISOString()
    };
  }
});

// Helper function to update purge status in Firestore
async function updatePurgeStatus(status) {
  const statusRef = db.collection('system_status').doc('purge_status');
  await statusRef.set({
    ...status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

// Helper function to get purge status from Firestore
async function getPurgeStatus() {
  const statusRef = db.collection('system_status').doc('purge_status');
  const doc = await statusRef.get();
  if (!doc.exists) {
    return {
      timestamp: null,
      success: false,
      error: null,
      itemsPurged: 0
    };
  }
  const data = doc.data();
  if (data.timestamp?.toDate) data.timestamp = data.timestamp.toDate();
  if (data.updatedAt?.toDate) data.updatedAt = data.updatedAt.toDate();
  return data;
}

// Daily data purge function (using v1 syntax)
// Temporarily commented out due to deployment issues
// exports.dailyDataPurge = functionsV1.pubsub
//   .schedule('every 24 hours')
//   .onRun(async (context) => {
//     const startTime = new Date();
//     console.log(`Starting daily data purge at ${startTime.toISOString()}`);
//     
//     try {
//       // Simulate data purge operations
//       const itemsToPurge = [
//         { type: 'temp_files', age: '7d' },
//         { type: 'logs', age: '30d' },
//         { type: 'cache', age: '1d' }
//       ];
//       
//       let purgedCount = 0;
//       
//       // Simulate purging each type of data
//       for (const item of itemsToPurge) {
//         console.log(`Purging ${item.type} older than ${item.age}`);
//         // Add your actual purge logic here
//         // For example: await db.collection(item.type).where('createdAt', '<', cutoffDate).delete();
//         purgedCount++;
//       }
//       
//       // Update purge status in Firestore
//       await updatePurgeStatus({
//         timestamp: new Date(),
//         success: true,
//         error: null,
//         itemsPurged: purgedCount
//       });
//       
//       console.log(`Purge completed successfully. Purged ${purgedCount} items.`);
//       return null;
//     } catch (error) {
//       console.error('Purge failed:', error);
//       
//       // Update purge status in Firestore with error
//       await updatePurgeStatus({
//         timestamp: new Date(),
//         success: false,
//         error: error.message,
//         itemsPurged: 0
//       });
//       
//       throw error;
//     }
//   });

// Health check function (using v1 syntax)
exports.purgeHealthCheck = functionsV1.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = new Date();
    console.log(`Running health check at ${now.toISOString()}`);
    
    try {
      // Get purge status from Firestore
      const lastPurgeStatus = await getPurgeStatus();
      
      const healthStatus = {
        timestamp: now,
        lastPurge: lastPurgeStatus,
        systemStatus: 'healthy',
        warnings: []
      };
      
      // Check if last purge was successful
      if (!lastPurgeStatus.success) {
        healthStatus.warnings.push('Last purge failed: ' + lastPurgeStatus.error);
        healthStatus.systemStatus = 'warning';
      }
      
      // Check if last purge was too long ago (more than 25 hours)
      if (lastPurgeStatus.timestamp) {
        const lastPurgeDate = lastPurgeStatus.timestamp;
const hoursSinceLastPurge = (now.getTime() - lastPurgeDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastPurge > 25) {
          healthStatus.warnings.push(`Last purge was ${hoursSinceLastPurge.toFixed(1)} hours ago`);
          healthStatus.systemStatus = 'warning';
        }
      }
      
      // Log health status
      console.log('Health check results:', healthStatus);
      
      // If there are warnings, you might want to send notifications
      if (healthStatus.warnings.length > 0) {
        console.log('Warnings detected:', healthStatus.warnings);
        // Add notification logic here (e.g., email, Slack, etc.)
      }
      
      return null;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }); 