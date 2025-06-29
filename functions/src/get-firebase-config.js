// Public endpoint to get Firebase configuration
// This is needed to bootstrap the Firebase SDK on the client

const { onCall } = require('firebase-functions/v2/https');
const functions = require('firebase-functions');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const gsm = new SecretManagerServiceClient();
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

/**
 * Public HTTP endpoint to get Firebase configuration
 * This is safe because Firebase configuration is meant to be public
 * The API key is restricted by domain in the Firebase console
 */
let cachedConfig;          // <-- module-level cache

const getFirebaseConfig = onCall({ cors: true, memory: '1GiB' }, async (request) => {
  // Require authentication for HIPAA compliance
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    if (!cachedConfig) {
      const name = `projects/${PROJECT_ID}/secrets/firebase-config/versions/latest`;
      const [version] = await gsm.accessSecretVersion({ name });
      const configData = version.payload?.data?.toString() || '';
      if (!configData) throw new Error('Firebase config not found in Secret Manager');

      cachedConfig = JSON.parse(configData);
    }
 
    return cachedConfig;
  } catch (error) {
    console.error('Error fetching Firebase config:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch Firebase configuration');
  }
});

module.exports = { getFirebaseConfig };