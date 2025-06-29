// Public endpoint to get Firebase configuration
// This is needed to bootstrap the Firebase SDK on the client

const { onRequest } = require('firebase-functions/v2/https');

/**
 * Public HTTP endpoint to get Firebase configuration
 * This is safe because Firebase configuration is meant to be public
 * The API key is restricted by domain in the Firebase console
 * 
 * CORS is handled by Firebase Functions v2 automatically when cors array is specified
 */
const getFirebaseConfig = onRequest({ 
  memory: '256MiB',
  cors: [
    'http://localhost:3000',
    'http://localhost:5173', // Vite default
    'http://localhost:5000', // Firebase hosting emulator
    'https://luknerlumina-firebase.web.app',
    'https://luknerlumina-firebase.firebaseapp.com'
  ]
}, async (req, res) => {
  try {
    console.log('📡 Firebase config request from:', req.headers.origin);
    console.log('🔍 Request method:', req.method);
    
    // Add manual CORS headers for additional security
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log('✅ CORS preflight request handled');
      res.status(204).send('');
      return;
    }
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
   
      console.log('✅ Firebase config returned successfully');
      res.status(200).json(config);
  } catch (error) {
    console.error('❌ Error returning Firebase config:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Firebase configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = { getFirebaseConfig };