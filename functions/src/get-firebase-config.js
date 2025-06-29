// Public endpoint to get Firebase configuration
// This is needed to bootstrap the Firebase SDK on the client

const { onRequest } = require('firebase-functions/v2/https');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const cors = require('cors')({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
});

const gsm = new SecretManagerServiceClient();
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

/**
 * Public HTTP endpoint to get Firebase configuration
 * This is safe because Firebase configuration is meant to be public
 * The API key is restricted by domain in the Firebase console
 */
let cachedConfig;          // <-- module-level cache

const getFirebaseConfig = onRequest({ 
  memory: '1GiB' 
}, async (req, res) => {
  // Handle CORS preflight requests
  cors(req, res, async () => {

    try {
      if (!cachedConfig) {
        const name = `projects/${PROJECT_ID}/secrets/firebase-config/versions/latest`;
        const [version] = await gsm.accessSecretVersion({ name });
        const configData = version.payload?.data?.toString() || '';
        if (!configData) throw new Error('Firebase config not found in Secret Manager');

        cachedConfig = JSON.parse(configData);
      }
   
      res.status(200).json(cachedConfig);
    } catch (error) {
      console.error('Error fetching Firebase config:', error);
      res.status(500).json({ error: 'Failed to fetch Firebase configuration' });
    }
  });
});

module.exports = { getFirebaseConfig };