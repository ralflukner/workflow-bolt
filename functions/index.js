const functions = require('firebase-functions');
const functionsV1 = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin (avoid duplicate app error)
if (!admin.apps.length) {
  admin.initializeApp();
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
    // For now, return a simple success response
    // In production, this would actually test the Tebra API connection
    return { 
      success: true, 
      message: 'Tebra API connection test successful',
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
    
    // Mock response for now
    // In production, this would call the actual Tebra API
    return {
      success: true,
      data: {
        PatientId: patientId,
        FirstName: 'Test',
        LastName: 'Patient',
        DateOfBirth: '1990-01-01',
        Phone: '555-0123',
        Email: 'test@example.com'
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
    
    // Mock response for now
    // In production, this would call the actual Tebra API
    return {
      success: true,
      data: [
        {
          PatientId: '123',
          FirstName: 'John',
          LastName: searchCriteria.lastName || 'Doe',
          DateOfBirth: '1985-05-15',
          Phone: '555-0123',
          Email: 'john.doe@example.com'
        },
        {
          PatientId: '124',
          FirstName: 'Jane',
          LastName: searchCriteria.lastName || 'Doe',
          DateOfBirth: '1990-08-22',
          Phone: '555-0124',
          Email: 'jane.doe@example.com'
        }
      ]
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
    const { providerId, locationId, startDate, endDate } = request.data;
    
    // Mock response for now
    // In production, this would call the actual Tebra API
    return {
      success: true,
      data: [
        {
          AppointmentId: 'APT001',
          PatientId: '123',
          ProviderId: providerId,
          LocationId: locationId,
          StartDateTime: startDate || new Date().toISOString(),
          EndDateTime: endDate || new Date().toISOString(),
          Status: 'Scheduled',
          Type: 'Follow-up'
        }
      ]
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
    // Mock response for now
    // In production, this would call the actual Tebra API
    return {
      success: true,
      data: [
        {
          ProviderId: 'PROV001',
          FirstName: 'Dr. Sarah',
          LastName: 'Johnson',
          Specialty: 'General Practice',
          Email: 'sarah.johnson@clinic.com'
        },
        {
          ProviderId: 'PROV002',
          FirstName: 'Dr. Michael',
          LastName: 'Chen',
          Specialty: 'Cardiology',
          Email: 'michael.chen@clinic.com'
        }
      ]
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
  console.log('Syncing today\'s schedule...');
  
  try {
    // Mock response for now
    // In production, this would call the actual Tebra API
    const today = new Date().toISOString().split('T')[0];
    
    return {
      success: true,
      data: {
        date: today,
        appointments: [
          {
            AppointmentId: 'APT001',
            PatientId: '123',
            PatientName: 'John Doe',
            Time: '09:00 AM',
            Type: 'Check-up',
            Status: 'Scheduled'
          },
          {
            AppointmentId: 'APT002',
            PatientId: '124',
            PatientName: 'Jane Doe',
            Time: '10:30 AM',
            Type: 'Follow-up',
            Status: 'Scheduled'
          }
        ],
        syncedAt: new Date().toISOString()
      }
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
    
    // For development: Return a mock success response
    // In production, you would:
    // 1. Verify the Auth0 token with Auth0's API
    // 2. Extract user information from the token
    // 3. Create or update a Firebase user
    // 4. Generate a custom Firebase token (requires IAM permissions)
    
    // For now, return a success response without creating a custom token
    // This allows the app to proceed with development
    return {
      success: true,
      data: {
        // Mock Firebase token for development
        firebaseToken: 'mock-firebase-token-' + Date.now(),
        uid: 'auth0|mock-user-' + Date.now(),
        message: 'Development mode - using mock authentication'
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