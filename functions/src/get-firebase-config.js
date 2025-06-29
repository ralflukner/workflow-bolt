// Public endpoint to get Firebase configuration
// This is needed to bootstrap the Firebase SDK on the client

const { onRequest } = require('firebase-functions/v2/https');
const cors = require('cors')({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
});

/**
 * Public HTTP endpoint to get Firebase configuration
 * This is safe because Firebase configuration is meant to be public
 * The API key is restricted by domain in the Firebase console
 */
const getFirebaseConfig = onRequest({ 
  memory: '256MiB' 
}, async (req, res) => {
  // Handle CORS preflight requests
  cors(req, res, async () => {
    try {
      // Return Firebase config from environment variables only
      const config = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
        measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
      };

      // Validate all required fields are present
      const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      const missingFields = requiredFields.filter(field => !config[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required Firebase config fields: ${missingFields.join(', ')}`);
      }
   
      res.status(200).json(config);
    } catch (error) {
      console.error('Error returning Firebase config:', error);
      res.status(500).json({ error: 'Failed to fetch Firebase configuration' });
    }
  });
});

module.exports = { getFirebaseConfig };