const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');
const functions = require('firebase-functions');

class TebraProxyClient {
  constructor() {
    this.initialized = false;
    this.cloudRunUrl = null;
    this.internalApiKey = null;
    this.auth = null;
    this.authClient = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Get configuration from Firebase Functions config
      const config = functions.config().tebra;
      if (!config?.cloud_run_url || !config?.internal_api_key) {
        throw new Error('Missing Tebra Cloud Run configuration in Firebase Functions config');
      }

      this.cloudRunUrl = config.cloud_run_url;
      this.internalApiKey = config.internal_api_key;

      // Validate Cloud Run URL
      const url = new URL(this.cloudRunUrl);
      if (url.protocol !== 'https:') {
        throw new Error('Tebra Cloud Run URL must use HTTPS');
      }

      // Initialize Google Auth for Cloud Run authentication
      this.auth = new GoogleAuth();
      this.authClient = await this.auth.getIdTokenClient(this.cloudRunUrl);
      console.log('Google Auth initialized for Cloud Run authentication');

      this.initialized = true;
      console.log('Tebra Cloud Run client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tebra Cloud Run client:', error);
      throw new Error(`Failed to initialize Tebra Cloud Run client: ${error.message}`);
    }
  }

  async makeRequest(action, params = {}) {
    await this.initialize();

    try {
      console.log(`[TebraCloudRun] 🌐 Making request: ${action}`);
      
      // Use Google Auth client to make the request with ID token
      const requestOptions = {
        url: this.cloudRunUrl,
        method: 'POST',
        headers: {
          'X-API-Key': this.internalApiKey,
          'Content-Type': 'application/json',
        },
        data: { action, params }
      };

      const response = await this.authClient.request(requestOptions);
      console.log(`[TebraCloudRun] 📡 HTTP Response status: ${response.status}`);
      
      const result = response.data;
      console.log('[TebraCloudRun] 📥 Response received, processing...');

      if (response.status < 200 || response.status >= 300) {
        console.error(`[TebraCloudRun] ❌ HTTP Error: ${response.status}`, result);
        throw new Error(result?.error || `HTTP ${response.status}`);
      }

      if (!result.success) {
        console.error('[TebraCloudRun] ❌ Request reported failure:', result);
        throw new Error(result.error || 'Request failed');
      }

      console.log('[TebraCloudRun] ✅ Request completed successfully');
      return result.data;
    } catch (error) {
      console.error('Tebra Cloud Run request failed:', error.message);
      if (error.response) {
        console.error(`[TebraCloudRun] Response status: ${error.response.status}`);
        console.error(`[TebraCloudRun] Response data:`, error.response.data);
      }
      throw new Error(`Tebra API request failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      console.log('[TebraCloudRun] 🔍 Starting connection test...');
      const result = await this.makeRequest('health');
      console.log('[TebraCloudRun] ✅ Connection test successful:', result);
      return result.status === 'healthy';
    } catch (error) {
      console.error('[TebraCloudRun] ❌ Connection test failed:', error.message);
      return false;
    }
  }

  async getAppointments(fromDate, toDate) {
    if (!fromDate || !toDate) {
      throw new Error('Both fromDate and toDate are required');
    }
    if (new Date(fromDate) > new Date(toDate)) {
      throw new Error('fromDate must be before or equal to toDate');
    }
    
    console.log(`[TebraCloudRun] 🔍 Getting appointments for ${fromDate} to ${toDate}`);
    return this.makeRequest('getAppointments', { fromDate, toDate });
  }

  async getProviders() {
    return this.makeRequest('getProviders');
  }

  async getPatients(patientIds) {
    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      throw new Error('patientIds must be a non-empty array');
    }
    return this.makeRequest('getPatients', { patientIds });
  }
}

// Create singleton instance
const tebraProxyClient = new TebraProxyClient();

module.exports = { tebraProxyClient };