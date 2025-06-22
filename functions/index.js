// TEMPORARILY DISABLED - causing memory exhaustion
// require('./otel-init');
// Use minimal version instead
require('./otel-init-minimal');
const functions = require('firebase-functions');
const functionsV1 = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { 
  generateSecurityReport 
} = require('./src/monitoring');

// Initialize Firebase Admin (avoid duplicate app error)
if (!admin.apps.length) {
  // Initialize with default credentials and explicit project ID
  admin.initializeApp({
    projectId: 'luknerlumina-firebase'
  });
}

// Note: Secrets management moved to environment variables for this deployment

// -----------------------------------------------------------------------------
// Auth0 configuration & JWKS client – cached per Cloud Functions instance
// -----------------------------------------------------------------------------
let auth0Domain = null;
let auth0Audience = null;
let auth0ClientSecret = null;
let jwksClientInstance = null;
let auth0InitPromise = null;

/**
 * Initialise Auth0 secrets and the JWKS client once per cold start.
 * Subsequent calls await the same promise, avoiding repeat Secret Manager I/O.
 */
function initAuth0Config() {
  if (auth0InitPromise) return auth0InitPromise;

  auth0InitPromise = (async () => {
    const gsm = new SecretManagerServiceClient();
    const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

    // Mandatory secrets
    const [domainVersion] = await gsm.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/AUTH0_DOMAIN/versions/latest`
    });
    const [audienceVersion] = await gsm.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/AUTH0_AUDIENCE/versions/latest`
    });

    auth0Domain = domainVersion.payload?.data?.toString();
    auth0Audience = audienceVersion.payload?.data?.toString();

    if (!auth0Domain || !auth0Audience) {
      throw new Error('Missing Auth0 configuration in Secret Manager');
    }

    // Optional – only needed for HS256 tenants
    try {
      const [secretVersion] = await gsm.accessSecretVersion({
        name: `projects/${PROJECT_ID}/secrets/AUTH0_CLIENT_SECRET/versions/latest`
      });
      auth0ClientSecret = secretVersion.payload?.data?.toString();
    } catch (err) {
      console.info('AUTH0_CLIENT_SECRET not found – assuming RS256-signed tokens.');
    }

    // JWKS client (RS256 path)
    jwksClientInstance = jwksRsa({
      jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000, // 10 min
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });
  })();

  return auth0InitPromise;
}

/**
 * Verify Auth0 JWT (supports RS256 via JWKS & HS256 via client secret).
 * Secrets and JWKS client are cached by initAuth0Config().
 */
async function verifyAuth0Jwt(token) {
  await initAuth0Config();

  // Decode header to determine algorithm
  let header;
  try {
    header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString('utf-8'));
  } catch {
    throw new Error('Invalid JWT format');
  }

  // HS256 path
  if (header.alg === 'HS256') {
    if (!auth0ClientSecret) {
      throw new Error('AUTH0_CLIENT_SECRET not configured – cannot verify HS256 token');
    }

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        auth0ClientSecret,
        {
          algorithms: ['HS256'],
          audience: [
            auth0Audience, // Primary API audience
            `https://${auth0Domain}/userinfo` // Auth0 userinfo endpoint
          ],
          issuer: `https://${auth0Domain}/`
        },
        (err, decoded) => (err ? reject(err) : resolve(decoded))
      );
    });
  }

  // RS256 path
  const getSigningKey = (kidHeader, cb) =>
    jwksClientInstance.getSigningKey(kidHeader.kid, (err, key) => {
      if (err) return cb(err);
      cb(null, key.getPublicKey());
    });

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ['RS256'],
        audience: [
          auth0Audience, // Primary API audience
          `https://${auth0Domain}/userinfo` // Auth0 userinfo endpoint
        ],
        issuer: `https://${auth0Domain}/`
      },
      (err, decoded) => {
        if (err) {
          console.error('JWT_VERIFY_ERROR', err);
          return reject(err);
        }
        resolve(decoded);
      }
    );
  });
}

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// HIPAA Security: Rate limiting for DDoS protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint with different HTTP methods
app.get('/test', (req, res) => {
  res.json({ message: 'GET request successful', method: 'GET' });
});

app.post('/test', (req, res) => {
  const body = req.body;
  res.json({ 
    message: 'POST request successful', 
    method: 'POST',
    receivedData: body 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err.stack);
  const payload = process.env.NODE_ENV === 'development'
    ? { error: 'Internal server error', message: err.message }
    : { error: 'Internal server error' };
  res.status(500).json(payload);
});

// Keep api as 1st Gen
exports.api = functions.https.onRequest(app);

// HIPAA Compliance Functions
const { validateHIPAACompliance, testSecretRedaction } = require('./hipaaValidation');
exports.validateHIPAACompliance = validateHIPAACompliance;
exports.testSecretRedaction = testSecretRedaction;

// HIPAA-Compliant Tebra API Proxy - PHP ONLY (NO NODE.JS SOAP)
const { tebraProxyClient } = require('./src/tebra-proxy-client.js');

// Tebra API proxy endpoint for HIPAA compliance - CALLS PHP SERVICE ONLY
app.post('/api/tebra', async (req, res) => {
  try {
    const { action, params = {} } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    // ALL REQUESTS GO TO PHP CLOUD RUN SERVICE - NO NODE.JS SOAP
    const result = await tebraProxyClient.makeRequest(action, params);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Tebra PHP proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export getSecret callable (whitelisted secrets for frontend)
const { getSecret } = require('./src/get-secret.js');
exports.getSecret = getSecret;

// Export public Firebase config endpoint
const { getFirebaseConfig } = require('./src/get-firebase-config.js');
exports.getFirebaseConfig = getFirebaseConfig;


// Secure Auth0 token exchange function (HIPAA Compliant)
exports.exchangeAuth0Token = onCall({ cors: true }, async (request) => {
  const { auth0Token } = request.data || {};
  if (!auth0Token) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'auth0Token is required'
    );
  }

  // Debug: Log token format for troubleshooting
  try {
    const parts = auth0Token.split('.');
    if (parts.length === 3) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      console.log('JWT_DEBUG:', JSON.stringify({
        algorithm: header.alg,
        audience: payload.aud,
        issuer: payload.iss,
        subject: payload.sub,
        expiry: new Date(payload.exp * 1000).toISOString(),
        expectedAudience: [
          await initAuth0Config().then(() => auth0Audience),
          await initAuth0Config().then(() => `https://${auth0Domain}/userinfo`)
        ]
      }));
    }
  } catch (debugError) {
    console.error('JWT_DEBUG_ERROR:', debugError);
  }

  let decoded;
  try {
    decoded = await verifyAuth0Jwt(auth0Token);   // ① Full JWT verification
  } catch (err) {
    console.error('JWT_VERIFICATION_FAILED:', JSON.stringify({
      error: err.message,
      code: err.code,
      stack: err.stack,
      tokenLength: auth0Token?.length,
      tokenPrefix: auth0Token?.substring(0, 50)
    }));
    throw new functions.https.HttpsError('unauthenticated', `JWT verification failed: ${err.message}`);
  }

  // ② Derive a stable, safe Firebase UID
  const rawSub = decoded.sub || 'unknown_sub';
  const firebaseUid = rawSub.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 128); // Firebase UID rules

  // ③ Mint Firebase custom token
  let customToken;
  try {
    customToken = await admin.auth().createCustomToken(firebaseUid, {
      // Add custom claims for HIPAA compliance
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

  // HIPAA Audit Log
  console.log('HIPAA_AUDIT:', JSON.stringify({
    type: 'TOKEN_EXCHANGE_SUCCESS',
    userId: firebaseUid,
    auth0Sub: rawSub,
    timestamp: new Date().toISOString()
  }));

  // Return full response expected by frontend AuthBridge
  return {
    success: true,
    firebaseToken: customToken,
    uid: firebaseUid,
    message: 'Token exchange successful'
  };
});

// Security monitoring endpoint for HIPAA compliance
exports.getSecurityReport = onCall({ 
  cors: true,
  enforceAppCheck: process.env.NODE_ENV === 'production'
}, async (request) => {
  // HIPAA Security: Require authentication for security reports
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required for security reports');
  }

  // TODO: Add admin role check in production
  // if (!request.auth.token?.admin) {
  //   throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  // }

  try {
    const report = generateSecurityReport();

    // Log security report access
    console.log('HIPAA_AUDIT:', JSON.stringify({
      type: 'SECURITY_REPORT_ACCESS',
      userId: request.auth.uid,
      timestamp: new Date().toISOString()
    }));

    return {
      success: true,
      data: report
    };
  } catch (error) {
    console.error('Failed to generate security report:', error);
    return {
      success: false,
      message: 'Failed to generate security report'
    };
  }
});
