const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const soap = require('soap');

// Load environment variables
require('dotenv').config();

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Tebra SOAP Client Class
class TebraSoapClient {
  constructor(config = {}) {
    this.config = {
      wsdlUrl: config.wsdlUrl || process.env.TEBRA_SOAP_WSDL,
      username: config.username || process.env.TEBRA_SOAP_USERNAME,
      password: config.password || process.env.TEBRA_SOAP_PASSWORD,
    };

    // Validate required configuration
    if (!this.config.wsdlUrl || !this.config.username || !this.config.password) {
      throw new Error('Tebra SOAP configuration is incomplete. Please check environment variables.');
    }

    this.client = null;
  }

  async getClient() {
    if (this.client) return this.client;

    try {
      console.log('Creating SOAP client with WSDL:', this.config.wsdlUrl);
      this.client = await soap.createClientAsync(this.config.wsdlUrl);
      this.client.setSecurity(new soap.BasicAuthSecurity(this.config.username, this.config.password));
      console.log('SOAP client created successfully');
      return this.client;
    } catch (error) {
      console.error('Failed to create SOAP client:', error);
      throw new HttpsError('internal', `Failed to connect to Tebra API: ${error.message}`);
    }
  }

  async getPatientById(patientId) {
    const client = await this.getClient();
    try {
      console.log('Getting patient by ID:', patientId);
      const result = await client.GetPatientAsync({ patientId });
      return result[0];
    } catch (error) {
      console.error('Failed to get patient:', error);
      throw new HttpsError('internal', `Failed to retrieve patient data: ${error.message}`);
    }
  }

  async searchPatients(searchCriteria) {
    const client = await this.getClient();
    try {
      console.log('Searching patients with criteria:', searchCriteria);
      const result = await client.SearchPatientsAsync(searchCriteria);
      return result[0]?.patients || [];
    } catch (error) {
      console.error('Failed to search patients:', error);
      throw new HttpsError('internal', `Failed to search patients: ${error.message}`);
    }
  }

  async getAppointments(date) {
    const client = await this.getClient();
    try {
      console.log('Getting appointments for date:', date);
      const result = await client.GetAppointmentsAsync({ date });
      return result[0]?.appointments || [];
    } catch (error) {
      console.error('Failed to get appointments:', error);
      throw new HttpsError('internal', `Failed to retrieve appointments: ${error.message}`);
    }
  }

  async getProviders() {
    const client = await this.getClient();
    try {
      console.log('Getting providers');
      const result = await client.GetProvidersAsync({});
      return result[0]?.providers || [];
    } catch (error) {
      console.error('Failed to get providers:', error);
      throw new HttpsError('internal', `Failed to retrieve providers: ${error.message}`);
    }
  }

  async createAppointment(appointmentData) {
    const client = await this.getClient();
    try {
      console.log('Creating appointment:', appointmentData);
      const result = await client.CreateAppointmentAsync(appointmentData);
      return result[0];
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw new HttpsError('internal', `Failed to create appointment: ${error.message}`);
    }
  }

  async updateAppointment(appointmentData) {
    const client = await this.getClient();
    try {
      console.log('Updating appointment:', appointmentData);
      const result = await client.UpdateAppointmentAsync(appointmentData);
      return result[0];
    } catch (error) {
      console.error('Failed to update appointment:', error);
      throw new HttpsError('internal', `Failed to update appointment: ${error.message}`);
    }
  }
}

// Rate Limiter for Tebra API
class TebraRateLimiter {
  constructor() {
    this.rateLimits = {
      'GetPatient': 250,
      'SearchPatients': 500,
      'GetAppointments': 1000,
      'GetProviders': 500,
      'CreateAppointment': 2000,
      'UpdateAppointment': 2000,
    };
    this.lastCallTimes = {};
  }

  async waitForRateLimit(method) {
    const limit = this.rateLimits[method] || 1000;
    const lastCall = this.lastCallTimes[method] || 0;
    const timeSinceLastCall = Date.now() - lastCall;

    if (timeSinceLastCall < limit) {
      const waitTime = limit - timeSinceLastCall;
      console.log(`Rate limiting ${method}: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastCallTimes[method] = Date.now();
  }
}

const rateLimiter = new TebraRateLimiter();

// Tebra API Functions

/**
 * Test Tebra API connection
 */
exports.tebraTestConnection = onCall(async () => {
  try {
    console.log('Testing Tebra API connection...');
    const client = new TebraSoapClient();
    await rateLimiter.waitForRateLimit('GetProviders');
    await client.getProviders();

    console.log('Tebra API connection test successful');
    return { success: true, message: 'Tebra API connection successful' };
  } catch (error) {
    console.error('Tebra connection test failed:', error);
    return { success: false, message: error.message };
  }
});

/**
 * Get patient by ID
 */
exports.tebraGetPatient = onCall(async ({ data }) => {
  const { patientId } = data;

  if (!patientId) {
    throw new HttpsError('invalid-argument', 'Patient ID is required');
  }

  try {
    const client = new TebraSoapClient();
    await rateLimiter.waitForRateLimit('GetPatient');
    const patient = await client.getPatientById(patientId);

    return { success: true, data: patient };
  } catch (error) {
    console.error('Failed to get patient:', error);
    throw error;
  }
});

/**
 * Search patients
 */
exports.tebraSearchPatients = onCall(async ({ data }) => {
  const { searchCriteria } = data;

  if (!searchCriteria) {
    throw new HttpsError('invalid-argument', 'Search criteria is required');
  }

  try {
    const client = new TebraSoapClient();
    await rateLimiter.waitForRateLimit('SearchPatients');
    const patients = await client.searchPatients(searchCriteria);

    return { success: true, data: patients };
  } catch (error) {
    console.error('Failed to search patients:', error);
    throw error;
  }
});

/**
 * Get appointments for a specific date
 */
exports.tebraGetAppointments = onCall(async ({ data }) => {
  const { date } = data;

  if (!date) {
    throw new HttpsError('invalid-argument', 'Date is required');
  }

  try {
    const client = new TebraSoapClient();
    await rateLimiter.waitForRateLimit('GetAppointments');
    const appointments = await client.getAppointments(date);

    return { success: true, data: appointments };
  } catch (error) {
    console.error('Failed to get appointments:', error);
    throw error;
  }
});

/**
 * Get all providers
 */
exports.tebraGetProviders = onCall(async () => {
  try {
    const client = new TebraSoapClient();
    await rateLimiter.waitForRateLimit('GetProviders');
    const providers = await client.getProviders();

    return { success: true, data: providers };
  } catch (error) {
    console.error('Failed to get providers:', error);
    throw error;
  }
});

/**
 * Create a new appointment
 */
exports.tebraCreateAppointment = onCall(async ({ data }) => {
  const { appointmentData } = data;

  if (!appointmentData) {
    throw new HttpsError('invalid-argument', 'Appointment data is required');
  }

  try {
    const client = new TebraSoapClient();
    await rateLimiter.waitForRateLimit('CreateAppointment');
    const result = await client.createAppointment(appointmentData);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create appointment:', error);
    throw error;
  }
});

/**
 * Update an existing appointment
 */
exports.tebraUpdateAppointment = onCall(async ({ data }) => {
  const { appointmentData } = data;

  if (!appointmentData) {
    throw new HttpsError('invalid-argument', 'Appointment data is required');
  }

  try {
    const client = new TebraSoapClient();
    await rateLimiter.waitForRateLimit('UpdateAppointment');
    const result = await client.updateAppointment(appointmentData);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update appointment:', error);
    throw error;
  }
});

/**
 * Sync today's schedule from Tebra
 */
exports.tebraSyncTodaysSchedule = onCall(async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const client = new TebraSoapClient();

    console.log('Syncing schedule for date:', today);

    // Get appointments for today
    await rateLimiter.waitForRateLimit('GetAppointments');
    const appointments = await client.getAppointments(today);

    // Transform appointments to match our Patient interface
    const transformedPatients = appointments.map(apt => ({
      id: apt.AppointmentId || apt.Id,
      name: `${apt.PatientFirstName || ''} ${apt.PatientLastName || ''}`.trim(),
      dob: apt.PatientDateOfBirth || apt.PatientDOB || '',
      appointmentTime: `${apt.AppointmentDate}T${apt.AppointmentTime}:00.000Z`,
      appointmentType: apt.AppointmentType || 'Office Visit',
      provider: `${apt.ProviderFirstName || 'Dr.'} ${apt.ProviderLastName || 'Unknown'}`,
      status: apt.Status?.toLowerCase() || 'scheduled',
      checkInTime: apt.CheckInTime || undefined,
      room: apt.Room || undefined,
      chiefComplaint: apt.ChiefComplaint || 'Follow-Up'
    }));

    // Store in Firebase for caching
    const sessionDoc = db.collection('daily_sessions').doc(today);
    await sessionDoc.set({
      date: today,
      patients: transformedPatients,
      lastSync: new Date(),
      source: 'tebra_sync'
    });

    console.log(`Sync completed: ${transformedPatients.length} appointments`);

    return { 
      success: true, 
      data: transformedPatients,
      message: `Synced ${transformedPatients.length} appointments for ${today}`
    };
  } catch (error) {
    console.error('Failed to sync schedule:', error);
    throw error;
  }
});

/**
 * Scheduled function to auto-sync Tebra data
 * Runs every 15 minutes during business hours (8 AM - 6 PM, Mon-Fri)
 */
exports.tebraAutoSync = onSchedule('*/15 8-18 * * 1-5', async (_event) => {
  console.log('Starting auto-sync of Tebra schedule...');

  try {
    const today = new Date().toISOString().split('T')[0];
    const client = new TebraSoapClient();

    await rateLimiter.waitForRateLimit('GetAppointments');
    const appointments = await client.getAppointments(today);

    const transformedPatients = appointments.map(apt => ({
      id: apt.AppointmentId || apt.Id,
      name: `${apt.PatientFirstName || ''} ${apt.PatientLastName || ''}`.trim(),
      dob: apt.PatientDateOfBirth || apt.PatientDOB || '',
      appointmentTime: `${apt.AppointmentDate}T${apt.AppointmentTime}:00.000Z`,
      appointmentType: apt.AppointmentType || 'Office Visit',
      provider: `${apt.ProviderFirstName || 'Dr.'} ${apt.ProviderLastName || 'Unknown'}`,
      status: apt.Status?.toLowerCase() || 'scheduled',
      checkInTime: apt.CheckInTime || undefined,
      room: apt.Room || undefined,
      chiefComplaint: apt.ChiefComplaint || 'Follow-Up'
    }));

    const sessionDoc = db.collection('daily_sessions').doc(today);
    await sessionDoc.set({
      date: today,
      patients: transformedPatients,
      lastSync: new Date(),
      source: 'tebra_auto_sync'
    });

    console.log(`Auto-sync completed: ${transformedPatients.length} appointments`);
    return { success: true, count: transformedPatients.length };
  } catch (error) {
    console.error('Auto-sync failed:', error);
    throw error;
  }
});

// Re-export existing functions
const { dailyDataPurge, manualDataPurge, purgeHealthCheck } = require('./dailyPurge');
exports.dailyDataPurge = dailyDataPurge;
exports.manualDataPurge = manualDataPurge;
exports.purgeHealthCheck = purgeHealthCheck; 
