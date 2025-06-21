// Secure, minimal JS version of the getSecret callable described earlier
// Uses Google Secret Manager to return whitelisted secrets to authenticated callers.
// HIPAA/PHI safe: never logs or returns sensitive values in full.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { getFirestore } = require('firebase-admin/firestore');

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
  'PATIENT_ENCRYPTION_KEY',
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

  // --- Rate limiting logic ---
  const RATE_LIMIT = 5; // max requests
  const WINDOW_MS = 60 * 1000; // 1 minute
  const userId = request.auth.uid;
  const db = getFirestore();
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const rateDocRef = db.collection('secretRateLimits').doc(userId);

  // Use a transaction to ensure atomicity
  const allowed = await db.runTransaction(async (tx) => {
    const doc = await tx.get(rateDocRef);
    let requests = [];
    if (doc.exists) {
      requests = (doc.data().requests || []).filter(ts => ts > windowStart);
    }
    if (requests.length >= RATE_LIMIT) {
      return false;
    }
    requests.push(now);
    tx.set(rateDocRef, { requests }, { merge: true });
    return true;
  });

  if (!allowed) {
    throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.');
  }
  // --- End rate limiting ---

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