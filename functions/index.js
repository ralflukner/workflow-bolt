const functions = require('firebase-functions');
const functionsV1 = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { tebraProxyClient } = require('./src/tebra-proxy-client');

// Initialize Firebase Admin (avoid duplicate app error)
if (!admin.apps.length) {
  // Initialize with default credentials and explicit project ID
  admin.initializeApp({
    projectId: 'luknerlumina-firebase'
  });
}
const db = admin.firestore();

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

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
exports.tebraGetPatient = onCall({ cors: true }, async (request) => {
  console.log('Getting patient:', request.data);
  
  try {
    const { patientId } = request.data;
    
    // Get actual patient data from Tebra
    const patientData = await tebraProxyClient.getPatientById(patientId);
    
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
        PatientId: patientData.PatientId || patientData.Id || patientId,
        FirstName: patientData.FirstName || '',
        LastName: patientData.LastName || '',
        DateOfBirth: patientData.DateOfBirth || patientData.DOB || '',
        Phone: patientData.Phone || patientData.PhoneNumber || '',
        Email: patientData.Email || patientData.EmailAddress || ''
      }
    };
  } catch (error) {
    console.error('Failed to get patient:', error);
    return {
      success: false,
      message: error.message || 'Failed to get patient'
    };
  }
});

// Search patients
exports.tebraSearchPatients = onCall({ cors: true }, async (request) => {
  console.log('Searching patients:', request.data);
  
  try {
    const { searchCriteria } = request.data;
    
    // Search for patients using Tebra API
    const patients = await tebraProxyClient.searchPatients(searchCriteria.lastName || '');
    
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
  console.log('Getting appointments:', request.data);
  
  try {
    const { date } = request.data;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get appointments from Tebra
    const appointments = await tebraProxyClient.getAppointments(targetDate, targetDate);
    
    // Transform the results
    const transformedAppointments = appointments.map(appointment => ({
      AppointmentId: appointment.AppointmentId || appointment.Id || '',
      PatientId: appointment.PatientId || appointment.patientId || '',
      ProviderId: appointment.ProviderId || appointment.providerId || '',
      AppointmentDate: appointment.Date || appointment.AppointmentDate || targetDate,
      AppointmentTime: appointment.Time || appointment.AppointmentTime || '',
      AppointmentType: appointment.Type || appointment.AppointmentType || 'Office Visit',
      Status: appointment.Status || appointment.status || 'Scheduled'
    }));
    
    return {
      success: true,
      data: transformedAppointments
    };
  } catch (error) {
    console.error('Failed to get appointments:', error);
    return {
      success: false,
      message: error.message || 'Failed to get appointments',
      data: []
    };
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
  console.log('Testing Tebra appointments endpoint...');
  
  try {
    const { date } = request.data || {};
    const targetDate = date || '2025-06-11';
    
    console.log('Fetching raw appointments for:', targetDate);
    const response = await tebraProxyClient.getAppointments(targetDate, targetDate);
    
    return {
      success: true,
      data: response,
      message: `Raw Tebra response for ${targetDate}`
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
  console.log('Creating appointment:', request.data);
  
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
  console.log('Updating appointment:', request.data);
  
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

// Sync today's schedule
exports.tebraSyncTodaysSchedule = onCall({ cors: true }, async (request) => {
  console.log('Syncing schedule...');
  
  try {
    // Verify user is authenticated for HIPAA compliance
    if (!request.auth) {
      throw new Error('Authentication required for patient data access');
    }
    
    // Check if a specific date was provided, otherwise use today in Central Time
    let targetDate;
    if (request.data && request.data.date) {
      targetDate = request.data.date;
      console.log('Syncing appointments for specific date:', targetDate);
    } else {
      // Get current date in Central Time (Texas)
      const now = new Date();
      const centralTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
      targetDate = centralTime.toISOString().split('T')[0];
      console.log('Current time in CT:', centralTime.toLocaleString());
      console.log('Syncing today\'s appointments for date:', targetDate);
    }
    
    const today = targetDate;
    
    // Get appointments from Tebra
    console.log(`🔍 Fetching appointments for date: ${today}`);
    const appointments = await tebraProxyClient.getAppointments(today, today);
    console.log('📋 Raw appointments response type:', typeof appointments);
    console.log('📋 Raw appointments response:', JSON.stringify(appointments, null, 2));
    console.log(`📊 Found ${Array.isArray(appointments) ? appointments.length : 'non-array'} appointments for ${today}`);
    
    // Get providers to enrich appointment data
    const providers = await tebraProxyClient.getProviders();
    console.log('Raw providers response:', JSON.stringify(providers, null, 2));
    console.log(`Found ${providers.length} providers`);
    const providerMap = new Map(providers.map(p => [
      p.ProviderId || p.ID || p.Id, 
      { 
        name: `${p.Degree || p.Title || 'Dr.'} ${p.FirstName} ${p.LastName}`,
        firstName: p.FirstName,
        lastName: p.LastName,
        title: p.Degree || p.Title || 'Dr.'
      }
    ]));
    
    // Transform appointments to Patient format for the dashboard
    const transformedPatients = [];
    console.log(`🔄 Starting transformation of ${Array.isArray(appointments) ? appointments.length : 0} appointments`);
    
    for (const appointment of appointments) {
      try {
        // Get patient details
        const patientId = appointment.PatientId || appointment.patientId;
        if (!patientId) continue;
        
        const patientData = await tebraProxyClient.getPatientById(patientId);
        if (!patientData) continue;
        
        // Parse appointment time
        const appointmentDateTime = appointment.StartTime || 
                                  appointment.AppointmentTime || 
                                  `${appointment.Date || appointment.AppointmentDate} ${appointment.Time || ''}`;
        
        // Get provider info
        const providerId = appointment.ProviderId || appointment.providerId;
        const provider = providerMap.get(providerId);
        
        // Map Tebra status to our internal status
        let status = 'scheduled';
        const tebraStatus = (appointment.Status || appointment.status || '').toLowerCase();
        if (tebraStatus === 'confirmed') {
          status = 'Confirmed';
        } else if (tebraStatus === 'cancelled') {
          status = 'Cancelled';
        } else if (tebraStatus === 'rescheduled') {
          status = 'Rescheduled';
        } else if (tebraStatus === 'no show') {
          status = 'No Show';
        }
        
        // Create patient object
        const patient = {
          id: patientData.PatientId || patientData.Id || patientId,
          name: `${patientData.FirstName || ''} ${patientData.LastName || ''}`.trim(),
          dob: patientData.DateOfBirth || patientData.DOB || '',
          appointmentTime: appointmentDateTime,
          appointmentType: appointment.Type || appointment.AppointmentType || 'Office Visit',
          provider: provider ? provider.name : 'Unknown Provider',
          status: status,
          checkInTime: undefined,
          room: undefined,
          // Additional fields for dashboard
          phone: patientData.Phone || patientData.PhoneNumber || '',
          email: patientData.Email || patientData.EmailAddress || ''
        };
        
        transformedPatients.push(patient);
        
      } catch (patientError) {
        console.error('Error processing patient:', patientError);
        // Continue with other patients
      }
    }
    
    // Store in Firestore for persistence
    const sessionRef = db.collection('daily_sessions').doc(today);
    await sessionRef.set({
      date: today,
      patients: transformedPatients,
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
      syncedBy: request.auth.uid
    }, { merge: true });
    
    console.log(`✅ Successfully synced ${transformedPatients.length} patients for ${today}`);
    console.log('📋 Final transformed patients:', JSON.stringify(transformedPatients, null, 2));
    
    return {
      success: true,
      data: transformedPatients,
      message: `Successfully synced ${transformedPatients.length} appointments`
    };
  } catch (error) {
    console.error('Failed to sync schedule:', error);
    return {
      success: false,
      message: error.message || 'Failed to sync today\'s schedule'
    };
  }
});

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