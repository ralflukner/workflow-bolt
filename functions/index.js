const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
const { defineString } = require('firebase-functions/params');

// Load environment variables
require('dotenv').config();

// Define parameters for configuration
const tebraProxyUrl = defineString('TEBRA_PROXY_URL', {
  default: 'https://tebra-proxy-623450773640.us-central1.run.app'
});

const tebraProxyApiKey = defineString('TEBRA_PROXY_API_KEY', {
  default: 'UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y='
});

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
exports.tebraSyncTodaysSchedule = onCall({}, async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await performDailySync(today);

    return {
      success: true,
      data,
      message: `Synced ${data.length} appointments for ${today}`
    };
  } catch (error) {
    console.error('Failed to sync schedule (callable):', error);
    throw error;
  }
});

/**
 * Scheduled function to auto-sync Tebra data
 * Runs every 15 minutes during business hours (8 AM - 6 PM, Mon-Fri)
 */
exports.tebraAutoSync = onSchedule('*/15 8-18 * * 1-5', async () => {
  console.log('Starting auto-sync of Tebra schedule...');
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await performDailySync(today);
    return { success: true, count: data.length };
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
