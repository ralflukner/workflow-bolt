const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
const { defineString, defineBool } = require('firebase-functions/params');

// Load environment variables
require('dotenv').config();

// Define parameters for configuration
const tebraProxyUrl = defineString('TEBRA_PROXY_URL', {
  default: 'https://tebra-proxy-623450773640.us-central1.run.app'
});

const tebraProxyApiKey = defineString('TEBRA_PROXY_API_KEY', {
  default: 'UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y='
});

// Feature-flag controls
const syncEnabled = defineBool('SYNC_ENABLED', { default: true });   // set to false to disable all backend auto-syncs

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Tebra API Client using PHP Proxy
class TebraApiClient {
  constructor(config = {}) {
    this.config = {
      proxyBaseUrl: config.proxyBaseUrl || tebraProxyUrl.value(),
      apiKey: config.apiKey || tebraProxyApiKey.value(),
      timeout: config.timeout || 30000, // 30 seconds
    };

    console.log('Tebra API Client initialized with proxy:', this.config.proxyBaseUrl);
  }

  /**
   * Make HTTP request to PHP proxy with API key authentication
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.config.proxyBaseUrl}/${endpoint}`;
      console.log(`Making ${method} request to: ${url}`);
      
      const config = {
        method,
        url,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'User-Agent': 'LuknerClinic-Firebase/1.0'
        }
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }
      
      const response = await axios(config);
      
      if (response.data.success) {
        console.log(`${endpoint} request successful`);
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Unknown API error');
      }
    } catch (error) {
      console.error(`${endpoint} request failed:`, error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new HttpsError('unauthenticated', 'Invalid API key for Tebra proxy');
      } else if (error.response?.status === 429) {
        throw new HttpsError('resource-exhausted', 'Rate limit exceeded for Tebra proxy');
      } else {
        throw new HttpsError('internal', `Failed to call ${endpoint}: ${error.message}`);
      }
    }
  }

  async testConnection() {
    try {
      console.log('Testing Tebra API connection via PHP proxy...');
      const healthData = await this.makeRequest('test');
      
      // Test providers endpoint to verify full functionality
      const providers = await this.getProviders();
      
      return {
        success: true,
        message: 'Tebra API connection successful via PHP proxy',
        authenticated: true,
        authorized: true,
        customerValid: true,
        proxy: healthData,
        providerCount: providers.length
      };
    } catch (error) {
      console.error('Failed to test connection:', error);
      throw error;
    }
  }

  async getProviders() {
    try {
      console.log('Getting providers via PHP proxy');
      const result = await this.makeRequest('providers');
      return result.providers || [];
    } catch (error) {
      console.error('Failed to get providers:', error);
      throw new HttpsError('internal', `Failed to retrieve providers: ${error.message}`);
    }
  }

  async getPatientById(patientId) {
    try {
      console.log('Getting patient by ID:', patientId);
      const result = await this.makeRequest(`patients/${patientId}`);
      return result.patient;
    } catch (error) {
      console.error('Failed to get patient:', error);
      throw new HttpsError('internal', `Failed to retrieve patient data: ${error.message}`);
    }
  }

  async searchPatients(searchCriteria) {
    try {
      console.log('Searching patients with criteria:', searchCriteria);
      const result = await this.makeRequest('patients', 'POST', searchCriteria);
      return result.patients || [];
    } catch (error) {
      console.error('Failed to search patients:', error);
      throw new HttpsError('internal', `Failed to search patients: ${error.message}`);
    }
  }

  async getAppointments(fromDate, toDate) {
    try {
      console.log('Getting appointments from', fromDate, 'to', toDate);
      const result = await this.makeRequest('appointments', 'POST', {
        fromDate,
        toDate
      });
      return result.appointments || [];
    } catch (error) {
      console.error('Failed to get appointments:', error);
      throw new HttpsError('internal', `Failed to retrieve appointments: ${error.message}`);
    }
  }

  async getPractices() {
    try {
      console.log('Getting practices via PHP proxy');
      const result = await this.makeRequest('practices');
      return result.practices || [];
    } catch (error) {
      console.error('Failed to get practices:', error);
      throw new HttpsError('internal', `Failed to retrieve practices: ${error.message}`);
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
      'GetPractices': 500,
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
exports.tebraTestConnection = onCall({ invoker: 'public' }, async () => {
  try {
    console.log('Testing Tebra API connection...');
    const client = new TebraApiClient();
    await rateLimiter.waitForRateLimit('GetProviders');
    const result = await client.testConnection();

    console.log('Tebra API connection test successful');
    return result;
  } catch (error) {
    console.error('Tebra connection test failed:', error);
    return { success: false, message: error.message };
  }
});

/**
 * Get patient by ID
 */
exports.tebraGetPatient = onCall({ invoker: 'public' }, async ({ data }) => {
  const { patientId } = data;

  if (!patientId) {
    throw new HttpsError('invalid-argument', 'Patient ID is required');
  }

  try {
    const client = new TebraApiClient();
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
exports.tebraSearchPatients = onCall({ invoker: 'public' }, async ({ data }) => {
  const { searchCriteria } = data;

  if (!searchCriteria) {
    throw new HttpsError('invalid-argument', 'Search criteria is required');
  }

  try {
    const client = new TebraApiClient();
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
exports.tebraGetAppointments = onCall({ invoker: 'public' }, async ({ data }) => {
  const { date } = data;

  if (!date) {
    throw new HttpsError('invalid-argument', 'Date is required');
  }

  try {
    const client = new TebraApiClient();
    await rateLimiter.waitForRateLimit('GetAppointments');
    const appointments = await client.getAppointments(date, date);

    return { success: true, data: appointments };
  } catch (error) {
    console.error('Failed to get appointments:', error);
    throw error;
  }
});

/**
 * Get all providers
 */
exports.tebraGetProviders = onCall({ invoker: 'public' }, async () => {
  try {
    const client = new TebraApiClient();
    await rateLimiter.waitForRateLimit('GetProviders');
    const providers = await client.getProviders();

    return { success: true, data: providers };
  } catch (error) {
    console.error('Failed to get providers:', error);
    throw error;
  }
});

/**
 * Get practices
 */
exports.tebraGetPractices = onCall({ invoker: 'public' }, async () => {
  try {
    const client = new TebraApiClient();
    await rateLimiter.waitForRateLimit('GetPractices');
    const practices = await client.getPractices();

    return { success: true, data: practices };
  } catch (error) {
    console.error('Failed to get practices:', error);
    throw error;
  }
});

// Helper to compute next Monday when today is Fri/Sat/Sun
function getTargetSyncDate(preferredDate = null) {
  if (preferredDate) return preferredDate;
  const today = new Date();
  const day = today.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  if (day === 5) {           // Friday → add 3 days
    today.setUTCDate(today.getUTCDate() + 3);
  } else if (day === 6) {    // Saturday → add 2 days
    today.setUTCDate(today.getUTCDate() + 2);
  } else if (day === 0) {    // Sunday → add 1 day
    today.setUTCDate(today.getUTCDate() + 1);
  }
  return today.toISOString().split('T')[0];
}

// Helper to perform daily sync – shared by manual callable and scheduled job
async function performDailySync(targetDate) {
  console.log(`Performing daily sync for ${targetDate}`);
  const client = new TebraApiClient();

  // Get appointments for the day
  await rateLimiter.waitForRateLimit('GetAppointments');
  const appointments = await client.getAppointments(targetDate, targetDate);

  // Transform appointments to internal Patient interface
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

  // Persist to Firestore for UI consumption
  const sessionDoc = db.collection('daily_sessions').doc(targetDate);
  await sessionDoc.set({
    date: targetDate,
    patients: transformedPatients,
    lastSync: new Date(),
    source: 'tebra_corrected_node_sync'
  });

  console.log(`Sync completed for ${targetDate}: ${transformedPatients.length} appointments`);
  return transformedPatients;
}

/**
 * Sync today's schedule from Tebra
 */
exports.tebraSyncTodaysSchedule = onCall({}, async ({ data }) => {
  const { date: customDate, force = false } = data || {};

  if (!syncEnabled.value() && !force) {
    return { success: false, message: 'Sync disabled by configuration' };
  }
  try {
    const targetDate = getTargetSyncDate(customDate);
    const patients = await performDailySync(targetDate);
    return { success: true, data: patients, message: `Synced ${patients.length} appointments for ${targetDate}` };
  } catch (error) {
    console.error('Manual sync failed:', error);
    throw error;
  }
});

/**
 * Scheduled function to auto-sync Tebra data
 * Runs every 15 minutes during business hours (8 AM - 6 PM, Mon-Fri)
 */
exports.tebraAutoSync = onSchedule('*/15 8-18 * * 1-5', async () => {
  if (!syncEnabled.value()) {
    console.log('Auto-sync skipped – disabled by configuration');
    return { success: false, message: 'Sync disabled' };
  }
  try {
    const targetDate = getTargetSyncDate();
    const patients = await performDailySync(targetDate);
    return { success: true, count: patients.length };
  } catch (error) {
    console.error('Auto-sync failed:', error);
    throw error;
  }
});

/**
 * Manually import a full schedule (array of patients) for a given date.
 * If merge=true we append/merge; otherwise we overwrite the existing doc.
 * The caller (UI or CLI) must already have validated that PHI may be sent.
 */
exports.manualImportSchedule = onCall({ invoker: 'public' }, async ({ data, auth }) => {
  const { date, patients, merge = false } = data || {};

  if (!Array.isArray(patients) || patients.length === 0) {
    throw new HttpsError('invalid-argument', 'patients array required');
  }
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const docRef = db.collection('daily_sessions').doc(targetDate);
    if (merge) {
      await docRef.set({
        date: targetDate,
        lastSync: new Date(),
        source: 'manual_import',
        patients
      }, { merge: true });
    } else {
      await docRef.set({
        date: targetDate,
        lastSync: new Date(),
        source: 'manual_import',
        patients
      });
    }

    console.log(`Manual schedule import for ${targetDate}: ${patients.length} patients (merge=${merge})`);
    return { success: true, count: patients.length };
  } catch (err) {
    console.error('Manual import failed:', err);
    throw new HttpsError('internal', err.message);
  }
});

/**
 * Manually append a single patient entry to a day's schedule.
 */
exports.manualAddPatient = onCall({ invoker: 'public' }, async ({ data }) => {
  const { date, patient } = data || {};
  if (!patient) {
    throw new HttpsError('invalid-argument', 'patient object required');
  }
  const targetDate = date || new Date().toISOString().split('T')[0];
  const docRef = db.collection('daily_sessions').doc(targetDate);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const existing = snap.exists ? (snap.data().patients || []) : [];
      tx.set(docRef, {
        date: targetDate,
        lastSync: new Date(),
        source: 'manual_add',
        patients: [...existing, patient]
      }, { merge: true });
    });

    console.log(`Added manual patient to ${targetDate}: ${patient.id || patient.name}`);
    return { success: true };
  } catch (e) {
    console.error('manualAddPatient failed:', e);
    throw new HttpsError('internal', e.message);
  }
});

// Re-export existing functions
const { dailyDataPurge, manualDataPurge, purgeHealthCheck } = require('./dailyPurge');
exports.dailyDataPurge = dailyDataPurge;
exports.manualDataPurge = manualDataPurge;
exports.purgeHealthCheck = purgeHealthCheck; 
