// HIPAA-Compliant Pre-Authentication Config Endpoint
// Provides minimal config needed for authentication without requiring auth

const functions = require('firebase-functions');
const cors = require('cors')({
  origin: [
    'https://luknerlumina-firebase.web.app',
    'https://luknerlumina-firebase.firebaseapp.com',
    'http://localhost:5173' // Dev only
  ],
  methods: ['GET', 'OPTIONS'] // Limit attack surface
});

const getFirebaseConfig = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const origin = req.headers.origin;
      const userAgent = req.headers['user-agent'];
      
      // Log for audit trail (HIPAA requirement)
      console.log(`Config request from ${origin}, UA: ${userAgent}`);
      
      // Basic request validation
      if (!userAgent) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      // Return MINIMAL config needed for authentication only
      // Use environment variables available in Firebase Functions
      const config = {
        apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || `${process.env.GCLOUD_PROJECT}.firebaseapp.com`,
        projectId: process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID
        // Removed: storageBucket, messagingSenderId, appId - not needed for auth
      };
      
      // Validate only essential fields
      if (!config.apiKey || !config.authDomain || !config.projectId) {
        throw new Error('Missing critical Firebase config');
      }
      
      res.json(config);
    } catch (error) {
      console.error('Config request failed:', error);
      res.status(500).json({ error: 'Service unavailable' });
    }
  });
});

module.exports = { getFirebaseConfig };