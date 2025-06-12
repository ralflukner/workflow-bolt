const functions = require('firebase-functions');
const functionsV1 = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
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
  admin.initializeApp({
    projectId: 'luknerlumina-firebase'
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

// Tebra API Functions
exports.tebraTestConnection = onCall({ cors: true }, async (request) => {
  console.log('Testing Tebra connection...');
  
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

// Auth0 token exchange function
exports.exchangeAuth0Token = onCall({ cors: true }, async (request) => {
  console.log('Exchanging Auth0 token for Firebase token...');
  
  try {
    const { auth0Token } = request.data;
    
    if (!auth0Token) {
      throw new Error('Auth0 token is required');
    }
    
    // TODO: Verify the Auth0 token
    // For now, we'll create a custom token but this needs proper verification
    
    // Extract user ID from Auth0 token (this should be done after verification)
    // In production, decode and verify the JWT token properly
    const uid = 'auth0|' + Date.now(); // This should be the actual Auth0 user ID
    
    // Log the service account being used
    console.log('Service account:', process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Using default credentials');
    console.log('Function service account:', process.env.K_SERVICE || 'Unknown');
    
    // Create a custom Firebase token
    const customToken = await admin.auth().createCustomToken(uid, {
      // Add custom claims for HIPAA compliance
      provider: 'auth0',
      hipaaCompliant: true,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      data: {
        firebaseToken: customToken,
        uid: uid
      }
    };
  } catch (error) {
    console.error('Token exchange failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to exchange token'
    };
  }
});