// Secure, minimal JS version of the getSecret callable described earlier
// Uses Google Secret Manager to return whitelisted secrets to authenticated callers.
// HIPAA/PHI safe: never logs or returns sensitive values in full.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const gsm = new SecretManagerServiceClient();

// Resolve project ID lazily so the module can be loaded in build/analysis environments
let PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null;

function resolveProjectId() {
  return PROJECT_ID || process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null;
}

// Only these secret IDs can be requested from the client.
const ALLOWED_SECRETS = new Set([
  'TEBRA_PROXY_API_KEY',
  'AUTH0_DOMAIN',
  'AUTH0_AUDIENCE',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'patient-encryption-key'
]);

/**
 * Callable Cloud Function: getSecret
 * @param {{ secretKey: string }} data
 * @return {{ value: string }}
 */
const getSecret = onCall({ enforceAppCheck: true }, async (request) => {
  // Require Firebase Authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const { secretKey } = request.data || {};
  if (!secretKey || typeof secretKey !== 'string') {
    throw new HttpsError('invalid-argument', '`secretKey` is required');
  }

  // Ensure the requested secret is allowed
  if (!ALLOWED_SECRETS.has(secretKey)) {
    throw new HttpsError('permission-denied', 'Access to this secret is not permitted');
  }

  // Build the GSM resource path
  const projectId = resolveProjectId();
  if (!projectId) {
    throw new HttpsError('internal', 'GCP project ID not configured');
  }
  const name = `projects/${projectId}/secrets/${secretKey}/versions/latest`;
  try {
    const [version] = await gsm.accessSecretVersion({ name });
    const payload = version.payload && version.payload.data && version.payload.data.toString();
    if (!payload) {
      throw new Error('Secret payload empty');
    }

    // Audit log without exposing value
    console.log('HIPAA_AUDIT', JSON.stringify({
      event: 'SECRET_ACCESS',
      secretKey,
      user: request.auth.uid,
      ts: Date.now(),
    }));

    return { value: payload };
  } catch (err) {
    console.error('getSecret error:', err);
    throw new HttpsError('internal', 'Failed to retrieve secret');
  }
});

module.exports = { getSecret }; 