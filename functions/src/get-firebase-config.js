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
      // Return Firebase config from environment variables
      const config = {
        apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBKw_H_G9Qq8YQKYNxZr5h4kZvOJq8HT4I',
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'luknerlumina-firebase.firebaseapp.com',
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'luknerlumina-firebase',
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'luknerlumina-firebase.firebasestorage.app',
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '623450773640',
        appId: process.env.VITE_FIREBASE_APP_ID || '1:623450773640:web:9afd63d3ccbb1fcb6fe73d',
        measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-W6TX8WRN2Z'
      };
   
      res.status(200).json(config);
    } catch (error) {
      console.error('Error returning Firebase config:', error);
      res.status(500).json({ error: 'Failed to fetch Firebase configuration' });
    }
  });
});

module.exports = { getFirebaseConfig };