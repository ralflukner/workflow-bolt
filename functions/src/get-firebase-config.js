// Public endpoint to get Firebase configuration
// This is needed to bootstrap the Firebase SDK on the client

const { onRequest } = require('firebase-functions/v2/https');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const gsm = new SecretManagerServiceClient();
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

/**
 * Public HTTP endpoint to get Firebase configuration
 * This is safe because Firebase configuration is meant to be public
 * The API key is restricted by domain in the Firebase console
 */
let cachedConfig;          // <-- module-level cache

const getFirebaseConfig = onRequest({ cors: true }, async (req, res) => {
  try {
     // Only allow GET requests
    if (!cachedConfig) {
      const name = `projects/${PROJECT_ID}/secrets/FIREBASE_API_KEY/versions/latest`;
      const [version] = await gsm.accessSecretVersion({ name });
      const apiKey = version.payload?.data?.toString() || '';
      if (!apiKey) throw new Error('Firebase API key not found in Secret Manager');

      cachedConfig = {
        apiKey,
        authDomain: 'luknerlumina-firebase.firebaseapp.com',
        projectId: 'luknerlumina-firebase',
        storageBucket: 'luknerlumina-firebase.appspot.com',
        messagingSenderId: '623450773640',
        appId: '1:623450773640:web:9afd63d3ccbb1fcb6fe73d',
        measurementId: 'G-W6TX8WRN2Z'
      };
    }
 
    res.status(200).json(cachedConfig);
  } catch (error) {
    console.error('Error fetching Firebase config:', error);
    res.status(500).json({ error: 'Failed to fetch Firebase configuration' });
  }
});

module.exports = { getFirebaseConfig };