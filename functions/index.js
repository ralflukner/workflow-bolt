// Load environment variables in development/emulator
if (process.env.FUNCTIONS_EMULATOR) {
  require('dotenv').config();
}

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
const { tebraProxyClient } = require('./src/tebra-proxy-client');
const { 
  validatePatientId, 
  validateDate, 
  validateSearchCriteria, 
  validateAppointmentData,
  logValidationAttempt 
} = require('./src/validation');
const { 
  monitorAuth, 
  monitorPhiAccess, 
  monitorValidationFailure,
  generateSecurityReport 
} = require('./src/monitoring');

// Initialize Firebase Admin (avoid duplicate app error)
if (!admin.apps.length) {
  // Initialize with default credentials and explicit project ID
  // In emulator mode, we need to use a service account or set GOOGLE_APPLICATION_CREDENTIALS
  const config = {
    projectId: 'luknerlumina-firebase'
  };
  admin.initializeApp(config);
}

// Note: Secrets management moved to environment variables for this deployment

/** Verifies an Auth0 RS256 access / ID token and returns the decoded payload */
async function verifyAuth0Jwt(token) {
  // Get Auth0 config from environment variables
  const domain = process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN;
  const audience = process.env.AUTH0_AUDIENCE || process.env.VITE_AUTH0_AUDIENCE;
  
  if (!domain || !audience) {
    throw new Error('Missing Auth0 configuration in environment variables');
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

// Tebra API Functions
exports.tebraTestConnection = onCall({ cors: true }, async (request) => {
  console.log('Testing Tebra connection...');
  console.log('Environment - TEBRA_CLOUD_RUN_URL:', process.env.TEBRA_CLOUD_RUN_URL);
  console.log('Environment - GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
  try {
    // Test actual Tebra API connection
    const connected = await tebraProxyClient.testConnection();
    
    return { 
      success: connected, 
      message: connected ? 'Tebra API connection test successful' : 'Tebra API connection failed',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Tebra connection test failed:', error);
    console.error('Full error details:', error.stack);
    return { 
      success: false, 
      message: error.message || 'Connection test failed',
      timestamp: new Date().toISOString()
    };
  }
});

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
    const patientData = await tebraProxyClient.getPatientById(validatedPatientId);
    
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
    const patients = await tebraProxyClient.searchPatients(validatedCriteria.lastName || '');
    
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
    const appointments = await tebraProxyClient.getAppointments(targetDate, targetDate);
    
    // Return the appointments array directly
    return appointments;
  } catch (error) {
    console.error('Failed to get appointments:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get appointments');
  }
});

// Get providers
exports.tebraGetProviders = onCall({ cors: true }, async (request) => {
  console.log('Getting providers...');
  
  try {
    // Get actual providers from Tebra
    const providers = await tebraProxyClient.getProviders();
    
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
    const response = await tebraProxyClient.getAppointments(startDate, endDate);
    
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

// Secure Auth0 token exchange function (HIPAA Compliant)
exports.exchangeAuth0Token = onCall({ 
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
}, async (request) => {
  const { auth0Token } = request.data || {};
  if (!auth0Token) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'auth0Token is required'
    );
  }

  let decoded;
  try {
    decoded = await verifyAuth0Jwt(auth0Token);   // ① Full JWT verification
  } catch (err) {
    console.error('Invalid Auth0 JWT', err);
    throw new functions.https.HttpsError('unauthenticated', 'JWT verification failed', { originalError: err.message });
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
    throw new functions.https.HttpsError('internal', 'Could not mint custom token', { originalError: err.message });
  }

  // HIPAA Audit Log
  console.log('HIPAA_AUDIT:', JSON.stringify({
    type: 'TOKEN_EXCHANGE_SUCCESS',
    userId: firebaseUid,
    auth0Sub: rawSub,
    timestamp: new Date().toISOString()
  }));

  return { success: true, firebaseToken: customToken };
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