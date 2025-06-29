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

      // Return complete config needed for Firebase initialization
      // Use environment variables available in Firebase Functions
      const config = {
        apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || `${process.env.GCLOUD_PROJECT}.firebaseapp.com`,
        projectId: process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || `${process.env.GCLOUD_PROJECT}.appspot.com`,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID
      };
      
      // Debug logging to help troubleshoot missing environment variables
      console.log('Available config values:', {
        hasApiKey: !!config.apiKey,
        hasAuthDomain: !!config.authDomain,
        hasProjectId: !!config.projectId,
        hasStorageBucket: !!config.storageBucket,
        hasMessagingSenderId: !!config.messagingSenderId,
        hasAppId: !!config.appId,
        hasMeasurementId: !!config.measurementId,
        gcloudProject: process.env.GCLOUD_PROJECT,
        availableEnvVars: Object.keys(process.env).filter(key => 
          key.includes('FIREBASE') || key.includes('VITE_FIREBASE')
        )
      });
      
      // Validate essential fields (storageBucket can be auto-generated, others are required)
      if (!config.apiKey || !config.authDomain || !config.projectId) {
        throw new Error(`Missing critical Firebase config: apiKey=${!!config.apiKey}, authDomain=${!!config.authDomain}, projectId=${!!config.projectId}`);
      }
      
      // Filter out undefined values to keep response clean
      Object.keys(config).forEach(key => {
        if (config[key] === undefined) {
          delete config[key];
        }
      });
      
      res.json(config);
    } catch (error) {
      console.error('Config request failed:', error);
      res.status(500).json({ error: 'Service unavailable' });
    }
  });
});

module.exports = { getFirebaseConfig };