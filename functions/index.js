// Load environment variables in development/emulator
if (process.env.FUNCTIONS_EMULATOR) {
  require('dotenv').config();
}

const functions = require('firebase-functions');
const { onCall } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const axios = require('axios');

// Lazy loading for heavy dependencies to prevent startup timeouts
let tebraProxyClient = null;
const getTebraProxyClient = () => {
  if (!tebraProxyClient) {
    const { tebraProxyClient: client } = require('./src/tebra-proxy-client');
    tebraProxyClient = client;
  }
  return tebraProxyClient;
};

const { 
  validatePatientId, 
  validateDate, 
  validateSearchCriteria, 
  logValidationAttempt 
} = require('./src/validation');

// Credential verification system (CRITICAL: Re-enabled for security)
const {
  credentialVerificationMiddleware
} = require('./src/utils/credential-verification');

// Security monitoring system (CRITICAL: Re-enabled for HIPAA compliance)
const { 
  monitorPhiAccess, 
  generateSecurityReport 
} = require('./src/monitoring');

// Initialize Firebase Admin (avoid duplicate app error)
if (!admin.apps.length) {
  // In cloud environment, use default service account
  // In emulator mode, use explicit service account if available
  const config = {
    projectId: 'luknerlumina-firebase'
  };
  
  // Only set credential if running in emulator and file exists
  if (process.env.FUNCTIONS_EMULATOR && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const fs = require('fs');
      if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        config.credential = admin.credential.cert(serviceAccount);
      }
    } catch (error) {
      console.warn('Could not load service account credentials, using default:', error.message);
    }
  }
  
  admin.initializeApp(config);
}

// Note: Secrets management moved to environment variables for this deployment

/** Verifies an Auth0 RS256 access / ID token and returns the decoded payload */
async function verifyAuth0Jwt(token) {
  // Read Auth0 configuration from environment variables
  const domain = process.env.AUTH0_DOMAIN;
  const audience = process.env.AUTH0_AUDIENCE;
  
  // Expected values for comparison (for verification purposes)
  const expectedDomain = 'dev-uex7qzqmd8c4qnde.us.auth0.com';
  const expectedAudience = 'https://api.patientflow.com';
  
  // Validate environment variables are set
  if (!domain || !audience) {
    console.error('Missing Auth0 environment variables:', {
      AUTH0_DOMAIN: domain ? 'SET' : 'MISSING',
      AUTH0_AUDIENCE: audience ? 'SET' : 'MISSING'
    });
    throw new Error('Missing Auth0 configuration: AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables must be set');
  }
  
  // Verify the retrieved values match expected configuration
  if (domain !== expectedDomain) {
    console.warn('Auth0 domain mismatch:', {
      retrieved: domain,
      expected: expectedDomain,
      status: 'VERIFICATION_FAILED'
    });
  } else {
    console.log('Auth0 domain verification: PASSED');
  }
  
  if (audience !== expectedAudience) {
    console.warn('Auth0 audience mismatch:', {
      retrieved: audience,
      expected: expectedAudience,
      status: 'VERIFICATION_FAILED'
    });
  } else {
    console.log('Auth0 audience verification: PASSED');
  }
  
  // Additional validation for proper format
  if (!domain.includes('.auth0.com')) {
    throw new Error('Invalid Auth0 domain format: must be a valid Auth0 domain');
  }
  
  if (!audience.startsWith('https://')) {
    throw new Error('Invalid Auth0 audience format: must be a valid HTTPS URL');
  }
  
  // Create JWKS client with Auth0 domain
  const jwksClient = jwksRsa({
    jwksUri: `https://${domain}/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000,      // 10 min
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

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Block all subsequent requests if credential verification fails
app.use(credentialVerificationMiddleware({ blockOnFailure: true }));

// Lightweight health check endpoint (no rate limiting to avoid startup delays)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// HIPAA Security: Rate limiting for DDoS protection (only on API routes)
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
    // Skip rate limiting for health checks and test endpoints
    return req.path === '/health' || req.path === '/test';
  }
});

// Apply rate limiting only to API routes, not health checks
app.use('/api', limiter);

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

// Tebra API Proxy Route - HIPAA Compliant
app.post('/api/tebra', async (req, res) => {
  try {
    // HIPAA Compliance: Verify Firebase authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (authError) {
      console.error('Token verification failed:', authError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    // Extract action and params from request body
    const { action, params = {} } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action parameter is required'
      });
    }

    // HIPAA Audit Log (no PHI)
    console.log(`Tebra API request: ${action} by user: ${decodedToken.uid}`);

    // Forward request to TebraProxyClient
    const tebraClient = getTebraProxyClient();
    const result = await tebraClient.makeRequest(action, params);

    res.json(result);
    
  } catch (error) {
    console.error('Tebra API error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, _next) => {
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

// Tebra API Functions
exports.tebraTestConnection = onCall(
  {
    cors: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5002',
      'https://luknerlumina-firebase.web.app',
      'https://luknerlumina-firebase.firebaseapp.com'
    ]
  },
  async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'User must be authenticated'
    );
  }
  
  console.log('Testing Tebra connection...');
  console.log('Authenticated user:', request.auth.uid);
  console.log('Environment - TEBRA_CLOUD_RUN_URL:', process.env.TEBRA_CLOUD_RUN_URL);
  console.log('Environment - GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
  try {
    // Test actual Tebra API connection
    const connected = await getTebraProxyClient().testConnection();
    
    return { 
      success: connected, 
      message: connected ? 'Tebra API connection test successful' : 'Tebra API connection failed',
      userId: request.auth.uid,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Tebra connection test failed:', error);
    console.error('Full error details:', error.stack);
    return { 
      success: false, 
      message: error.message || 'Connection test failed',
      userId: request.auth.uid,
      timestamp: new Date().toISOString()
    };
  }
});

// Enhanced PHP proxy debugging function
exports.tebraDebugPhpProxy = onCall(
  {
    cors: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5002',
      'https://luknerlumina-firebase.web.app',
      'https://luknerlumina-firebase.firebaseapp.com'
    ]
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'User must be authenticated'
      );
    }
    
    console.log('Running PHP proxy diagnostics...');
    console.log('Authenticated user:', request.auth.uid);
    
    try {
      // Run comprehensive PHP proxy diagnostics
      const diagnostics = await getTebraProxyClient().debugPhpProxy();
      
      console.log('PHP proxy diagnostics completed:', {
        nodeJsToPhp: diagnostics.nodeJsToPhp.status,
        phpHealth: diagnostics.phpHealth.status,
        phpToTebra: diagnostics.phpToTebra.status,
        recommendationsCount: diagnostics.recommendations.length
      });
      
      return { 
        success: true, 
        data: diagnostics,
        userId: request.auth.uid,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('PHP proxy diagnostics failed:', error);
      console.error('Full error details:', error.stack);
      return { 
        success: false, 
        message: error.message || 'PHP proxy diagnostics failed',
        userId: request.auth.uid,
        timestamp: new Date().toISOString()
      };
    }
  }
);

// Get patient by ID
exports.tebraGetPatient = onCall({ 
  cors: true,
  enforceAppCheck: process.env.NODE_ENV === 'production' // Enable App Check in production
}, async (request) => {
  // HIPAA Compliance: Require authentication for PHI access
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required for patient data access');
  }
  
  // HIPAA Monitoring: Track PHI access
  monitorPhiAccess(request.auth.uid, 'PATIENT_GET', { 
    endpoint: 'tebraGetPatient',
    timestamp: new Date().toISOString()
  });
  
  try {
    // HIPAA Security: Validate and sanitize input
    const { patientId } = request.data;
    const validatedPatientId = validatePatientId(patientId);
    logValidationAttempt(request.auth.uid, 'PATIENT_ID_VALIDATION', true);
    
    // Get actual patient data from Tebra
    const patientData = await getTebraProxyClient().getPatientById(validatedPatientId);
    
    if (!patientData) {
      return {
        success: false,
        message: 'Patient not found'
      };
    }
    
    // Transform the data to our expected format
    return {
      success: true,
      data: {
        PatientId: patientData.PatientId || patientData.Id || validatedPatientId,
        FirstName: patientData.FirstName || '',
        LastName: patientData.LastName || '',
        DateOfBirth: patientData.DateOfBirth || patientData.DOB || '',
        Phone: patientData.Phone || patientData.PhoneNumber || '',
        Email: patientData.Email || patientData.EmailAddress || ''
      }
    };
  } catch (error) {
    // HIPAA Compliance: Log errors without PHI
    console.error(`Patient data access failed for user: ${request.auth?.uid}`, { 
      errorType: error.name,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      message: 'Failed to retrieve patient data' // Generic message to prevent PHI leakage
    };
  }
});

// Search patients
exports.tebraSearchPatients = onCall({ cors: true }, async (request) => {
  // HIPAA Compliance: Require authentication for PHI access
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required for patient search');
  }
  
  // HIPAA Monitoring: Track PHI access
  monitorPhiAccess(request.auth.uid, 'PATIENT_SEARCH', { 
    endpoint: 'tebraSearchPatients',
    timestamp: new Date().toISOString()
  });
  
  try {
    // HIPAA Security: Validate and sanitize search criteria
    const { searchCriteria } = request.data;
    const validatedCriteria = validateSearchCriteria(searchCriteria);
    logValidationAttempt(request.auth.uid, 'PATIENT_SEARCH_VALIDATION', true);
    
    // Search for patients using Tebra API
    const patients = await getTebraProxyClient().searchPatients(validatedCriteria.lastName || '');
    
    // Transform the results
    const transformedPatients = patients.map(patient => ({
      PatientId: patient.PatientId || patient.Id || '',
      FirstName: patient.FirstName || '',
      LastName: patient.LastName || '',
      DateOfBirth: patient.DateOfBirth || patient.DOB || '',
      Phone: patient.Phone || patient.PhoneNumber || '',
      Email: patient.Email || patient.EmailAddress || ''
    }));
    
    return {
      success: true,
      data: transformedPatients
    };
  } catch (error) {
    console.error('Failed to search patients:', error);
    return {
      success: false,
      message: error.message || 'Failed to search patients',
      data: []
    };
  }
});

// Get appointments
exports.tebraGetAppointments = onCall({ cors: true }, async (request) => {
  // HIPAA Compliance: Require authentication for PHI access
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required for appointment data access');
  }
  
  // HIPAA Monitoring: Track PHI access
  monitorPhiAccess(request.auth.uid, 'APPOINTMENT_GET', { 
    endpoint: 'tebraGetAppointments',
    timestamp: new Date().toISOString()
  });
  
  try {
    // HIPAA Security: Validate date input
    const { date } = request.data;
    const targetDate = date ? validateDate(date) : new Date().toISOString().split('T')[0];
    logValidationAttempt(request.auth.uid, 'APPOINTMENT_DATE_VALIDATION', true);
    
    // Get appointments from Tebra
    const appointments = await getTebraProxyClient().getAppointments(targetDate, targetDate);
    
    // Return the appointments array directly
    return appointments;
  } catch (error) {
    console.error('Failed to get appointments:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get appointments');
  }
});

// Get providers
exports.tebraGetProviders = onCall({ cors: true }, async (_request) => {
  console.log('Getting providers...');
  
  try {
    // Get actual providers from Tebra
    const providers = await getTebraProxyClient().getProviders();
    
    // Transform the results
    const transformedProviders = providers.map(provider => ({
      ProviderId: provider.ProviderId || provider.Id || '',
      FirstName: provider.FirstName || '',
      LastName: provider.LastName || '',
      Title: provider.Title || 'Dr.',
      Specialty: provider.Specialty || '',
      Email: provider.Email || ''
    }));
    
    return {
      success: true,
      data: transformedProviders
    };
  } catch (error) {
    console.error('Failed to get providers:', error);
    return {
      success: false,
      message: error.message || 'Failed to get providers',
      data: []
    };
  }
});

// Test Tebra appointments endpoint
exports.tebraTestAppointments = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Authentication required'
    );
  }
  console.log('Testing Tebra appointments endpoint...');
  
  try {
    const { fromDate, toDate, date } = request.data || {};
    const startDate = fromDate || date || '2025-06-10';
    const endDate = toDate || date || '2025-06-11';
    
    console.log(`Fetching raw appointments from ${startDate} to ${endDate}`);
    const response = await getTebraProxyClient().getAppointments(startDate, endDate);
    
    return {
      success: true,
      data: response,
      message: `Raw Tebra response for ${startDate} to ${endDate}`
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      message: error.message || 'Test failed'
    };
  }
});

// Create appointment
exports.tebraCreateAppointment = onCall({ cors: true }, async (request) => {
  // HIPAA Compliance: Require authentication for PHI operations
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required for appointment creation');
  }
  
  // Audit log for HIPAA compliance (no PHI logged)
  console.log(`Appointment creation requested by user: ${request.auth.uid}`);
  
  try {
    const appointmentData = request.data;
    
    // Mock response for now
    // In production, this would call the actual Tebra API
    return {
      success: true,
      data: {
        AppointmentId: 'APT' + Date.now(),
        ...appointmentData,
        Status: 'Scheduled'
      }
    };
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return {
      success: false,
      message: error.message || 'Failed to create appointment'
    };
  }
});

// Update appointment
exports.tebraUpdateAppointment = onCall({ cors: true }, async (request) => {
  // HIPAA Compliance: Require authentication for PHI operations
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required for appointment updates');
  }
  
  // Audit log for HIPAA compliance (no PHI logged)
  console.log(`Appointment update requested by user: ${request.auth.uid}`);
  
  try {
    const { appointmentId, updates } = request.data;
    
    // Mock response for now
    // In production, this would call the actual Tebra API
    return {
      success: true,
      data: {
        AppointmentId: appointmentId,
        ...updates,
        UpdatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return {
      success: false,
      message: error.message || 'Failed to update appointment'
    };
  }
});

// Import the new refactored sync function
const { tebraSyncTodaysSchedule } = require('./src/tebra-sync/index');
exports.tebraSyncTodaysSchedule = tebraSyncTodaysSchedule;

// Import and export getFirebaseConfig function
const { getFirebaseConfig } = require('./src/get-firebase-config');
exports.getFirebaseConfig = getFirebaseConfig;

// Secure Auth0 token exchange function (HIPAA Compliant) - HTTPS Function
const exchangeCors = require('cors')({
  origin: [
    'https://luknerlumina-firebase.web.app',
    'https://luknerlumina-firebase.firebaseapp.com',
    'http://localhost:5173'
  ],
  methods: ['POST', 'OPTIONS'],
  credentials: false
});

exports.exchangeAuth0Token = functions.https.onRequest((req, res) => {
  return exchangeCors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { auth0Token } = req.body || {};
      if (!auth0Token) {
        return res.status(400).json({
          success: false,
          message: 'auth0Token is required'
        });
      }

      let decoded;
      try {
        decoded = await verifyAuth0Jwt(auth0Token);   // ① Full JWT verification
      } catch (err) {
        console.error('Invalid Auth0 JWT', err);
        return res.status(401).json({
          success: false,
          message: 'JWT verification failed',
          error: err.message
        });
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
        return res.status(500).json({
          success: false,
          message: 'Could not mint custom token',
          error: err.message
        });
      }

      // HIPAA Audit Log
      console.log('HIPAA_AUDIT:', JSON.stringify({
        type: 'TOKEN_EXCHANGE_SUCCESS',
        userId: firebaseUid,
        auth0Sub: rawSub,
        timestamp: new Date().toISOString()
      }));

      res.json({ 
        success: true, 
        firebaseToken: customToken,
        uid: firebaseUid
      });
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
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

// ============================================================================
// UNIFIED TEBRA PROXY FUNCTION - Single endpoint for all Tebra operations
// ============================================================================

// Configuration for unified proxy
const PHP_PROXY_URL = 'https://tebra-php-api-623450773640.us-central1.run.app';
const PHP_API_KEY = '+fKP+62OymF4ebpP1co97axEG3j4jTb57+fwI9c6js0=';

// Valid actions that can be proxied to PHP
const VALID_ACTIONS = [
  'getProviders',
  'getPatients', 
  'getPatient',
  'searchPatients',
  'getAppointments',
  'createAppointment',
  'updateAppointment',
  'syncSchedule',
  'healthCheck'
];

/**
 * UNIFIED Tebra proxy function that handles ALL actions
 * Replaces individual tebraGetProviders, tebraGetPatients, etc.
 * 
 * @param {Object} request - Firebase Functions request with data and auth
 * @returns {Object} Response from PHP proxy or internal response
 */
exports.tebraProxy = onCall({ cors: true }, async (request) => {
  const startTime = Date.now();
  
  // Log the incoming request (sanitized)
  console.log('🔥 Tebra proxy called', {
    action: request.data.action,
    hasAuth: !!request.auth,
    uid: request.auth?.uid,
    timestamp: new Date().toISOString()
  });

  // Check authentication
  if (!request.auth) {
    console.error('❌ Unauthenticated request to tebraProxy');
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'User must be authenticated to access Tebra API'
    );
  }

  // Validate action parameter
  if (!request.data.action) {
    console.error('❌ Missing action parameter');
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Action parameter is required'
    );
  }

  if (!VALID_ACTIONS.includes(request.data.action)) {
    console.error('❌ Invalid action:', request.data.action);
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid action: ${request.data.action}. Valid actions: ${VALID_ACTIONS.join(', ')}`
    );
  }

  // Handle special internal actions that don't need PHP proxy
  if (request.data.action === 'healthCheck') {
    console.log('✅ Internal health check request');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      region: 'us-central1',
      authenticated: true,
      phpProxyUrl: PHP_PROXY_URL,
      function: 'tebraProxy',
      version: '2.0',
      duration: Date.now() - startTime
    };
  }

  // All other actions go to PHP proxy
  try {
    console.log(`📤 Forwarding ${request.data.action} to PHP proxy:`, PHP_PROXY_URL);
    
    const response = await axios.post(PHP_PROXY_URL, request.data, {
      headers: {
        'X-API-Key': PHP_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Firebase-Functions-TebraProxy/2.0',
        'X-Request-ID': `${request.auth.uid}-${Date.now()}` // For tracing
      },
      timeout: 30000, // 30 second timeout
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    const duration = Date.now() - startTime;
    
    console.log(`📥 PHP proxy response for ${request.data.action}:`, {
      status: response.status,
      duration: `${duration}ms`,
      hasData: !!response.data,
      success: response.data?.success
    });

    // Handle different response status codes
    if (response.status === 401) {
      console.error('❌ PHP proxy authentication failed');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication failed with PHP proxy - API key configuration issue'
      );
    }

    if (response.status === 403) {
      console.error('❌ PHP proxy access forbidden');
      throw new functions.https.HttpsError(
        'permission-denied',
        'Access forbidden by PHP proxy'
      );
    }

    if (response.status >= 400) {
      console.error('❌ PHP proxy error response:', {
        status: response.status,
        data: response.data
      });
      throw new functions.https.HttpsError(
        'internal',
        response.data?.error || `PHP proxy error: ${response.status}`
      );
    }

    // Log successful response (sanitized)
    if (response.data?.success) {
      console.log(`✅ ${request.data.action} completed successfully in ${duration}ms`);
    } else {
      console.warn(`⚠️ ${request.data.action} completed with issues:`, {
        success: response.data?.success,
        error: response.data?.error,
        duration: `${duration}ms`
      });
    }

    return response.data;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Enhanced error logging
    console.error(`❌ Tebra proxy error for ${request.data.action}:`, {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      duration: `${duration}ms`,
      timeout: error.code === 'ECONNABORTED',
      network: error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'
    });

    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'Request timeout - Tebra API or PHP proxy is slow'
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new functions.https.HttpsError(
        'unavailable',
        'PHP proxy service is unavailable'
      );
    }

    if (error.response?.status === 401) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication failed with PHP proxy - check API key configuration'
      );
    }

    if (error.response?.status === 429) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Rate limit exceeded on PHP proxy'
      );
    }

    // Generic error fallback
    throw new functions.https.HttpsError(
      'internal',
      error.response?.data?.error || 
      error.message || 
      `Failed to execute ${request.data.action}`
    );
  }
});

// ============================================================================
// LEGACY INDIVIDUAL TEBRA FUNCTIONS - DEPRECATED
// These are kept for backward compatibility but should use tebraProxy instead
// ============================================================================

// TODO: Remove these individual functions after migration to tebraProxy
// exports.tebraTestConnection = ... (kept for now)
// exports.tebraGetPatient = ... (kept for now)
// etc.

// ============================================================================

// Import and export credential verification functions
const credentialFunctions = require('./credential-functions');
exports.verifyCredentials = credentialFunctions.verifyCredentials;
exports.checkCredentials = credentialFunctions.checkCredentials;
exports.healthCheck = credentialFunctions.healthCheck;
exports.scheduledCredentialCheck = credentialFunctions.scheduledCredentialCheck;

exports.credentialHealth = functions.https.onRequest(async (req, res) => {
  try {
    // Use the healthCheck function from credential-functions module
    // by calling it directly as an HTTP request handler
    return await credentialFunctions.healthCheck(req, res);
  } catch (err) {
    console.error('Cred health check error:', err);
    res.status(500).json({ error: 'internal', message: err.message });
  }
});