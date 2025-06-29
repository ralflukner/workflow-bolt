// HIPAA-Compliant Pre-Authentication Config Endpoint
// Provides minimal config needed for authentication without requiring auth

const functions = require('firebase-functions');
const cors = require('cors')({
  origin: [
    'https://luknerlumina-firebase.web.app',
    'https://luknerlumina-firebase.firebaseapp.com',
    'http://localhost:5173' // Dev only
  ],
  credentials: true
});

const getFirebaseConfig = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Verify request origin and add basic security
      const origin = req.headers.origin;
      const userAgent = req.headers['user-agent'];
      
      // Log for audit trail (HIPAA requirement)
      console.log(`Config request from ${origin}, UA: ${userAgent}`);
      
      // Basic request validation
      if (!origin || !userAgent) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      // Return minimal config needed for authentication
      const config = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID
      };
      
      // Basic validation
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