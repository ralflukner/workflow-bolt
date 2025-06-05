const functions = require('firebase-functions');
const functionsV1 = require('firebase-functions/v1');
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

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
  res.status(500).json({
    error: 'Something broke!',
    message: err.message
  });
});

// Keep api as 1st Gen
exports.api = functions.https.onRequest(app);

// Store last purge status
let lastPurgeStatus = {
  timestamp: null,
  success: false,
  error: null,
  itemsPurged: 0
};

// Daily data purge function (using v1 syntax)
exports.dailyDataPurge = functionsV1.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const startTime = new Date();
    console.log(`Starting daily data purge at ${startTime.toISOString()}`);
    
    try {
      // Simulate data purge operations
      const itemsToPurge = [
        { type: 'temp_files', age: '7d' },
        { type: 'logs', age: '30d' },
        { type: 'cache', age: '1d' }
      ];
      
      let purgedCount = 0;
      
      // Simulate purging each type of data
      for (const item of itemsToPurge) {
        console.log(`Purging ${item.type} older than ${item.age}`);
        // Add your actual purge logic here
        // For example: await db.collection(item.type).where('createdAt', '<', cutoffDate).delete();
        purgedCount++;
      }
      
      // Update last purge status
      lastPurgeStatus = {
        timestamp: new Date(),
        success: true,
        error: null,
        itemsPurged: purgedCount
      };
      
      console.log(`Purge completed successfully. Purged ${purgedCount} items.`);
      return null;
    } catch (error) {
      console.error('Purge failed:', error);
      
      // Update last purge status with error
      lastPurgeStatus = {
        timestamp: new Date(),
        success: false,
        error: error.message,
        itemsPurged: 0
      };
      
      throw error;
    }
  });

// Health check function (using v1 syntax)
exports.purgeHealthCheck = functionsV1.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = new Date();
    console.log(`Running health check at ${now.toISOString()}`);
    
    try {
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
        const hoursSinceLastPurge = (now - lastPurgeStatus.timestamp) / (1000 * 60 * 60);
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