// Minimal Firebase Functions for faster startup
const functions = require('firebase-functions');
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'luknerlumina-firebase'
  });
}

/** Verifies an Auth0 RS256 access / ID token and returns the decoded payload */
async function verifyAuth0Jwt(token) {
  // Use hardcoded values for reliable startup
  const domain = 'dev-uex7qzqmd8c4qnde.us.auth0.com';
  const audience = 'https://api.patientflow.com';

  // Create JWKS client with Auth0 domain
  const jwksClient = jwksRsa({
    jwksUri: `https://${domain}/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });

  const getSigningKey = (header, cb) =>
    jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) return cb(err);
      cb(null, key.getPublicKey());
    });

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ['RS256'],
        audience: audience,
        issuer: `https://${domain}/`
      },
      (err, decoded) => (err ? reject(err) : resolve(decoded))
    );
  });
}

// Minimal Auth0 token exchange function
exports.exchangeAuth0Token = onCall({ cors: true }, async (request) => {
  const { auth0Token } = request.data || {};
  if (!auth0Token) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'auth0Token is required'
    );
  }

  let decoded;
  try {
    decoded = await verifyAuth0Jwt(auth0Token);
  } catch (err) {
    console.error('Invalid Auth0 JWT', err);
    throw new functions.https.HttpsError('unauthenticated', 'JWT verification failed');
  }

  // Derive Firebase UID
  const rawSub = decoded.sub || 'unknown_sub';
  const firebaseUid = rawSub.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 128);

  // Create Firebase custom token
  let customToken;
  try {
    customToken = await admin.auth().createCustomToken(firebaseUid, {
      provider: 'auth0',
      hipaaCompliant: true,
      email: decoded.email,
      email_verified: decoded.email_verified,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Failed to mint custom token', err);
    throw new functions.https.HttpsError('internal', 'Could not mint custom token');
  }

  console.log('HIPAA_AUDIT:', JSON.stringify({
    type: 'TOKEN_EXCHANGE_SUCCESS',
    userId: firebaseUid,
    timestamp: new Date().toISOString()
  }));

  return { success: true, firebaseToken: customToken };
});