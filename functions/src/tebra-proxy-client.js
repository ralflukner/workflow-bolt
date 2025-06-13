const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

class TebraProxyClient {
  constructor() {
    this.initialized = false;
    this.proxyUrl = null;
    this.proxyApiKey = null;
    this.auth = null;
    this.authClient = null;
    this.secretClient = new SecretManagerServiceClient();
    this.projectId = 'luknerlumina-firebase';
  }

  async getSecret(secretName) {
    try {
      const [version] = await this.secretClient.accessSecretVersion({
        name: `projects/${this.projectId}/secrets/${secretName}/versions/latest`,
      });
      return version.payload?.data?.toString() || '';
    } catch (error) {
      console.error(`Error reading secret ${secretName}:`, error);
      throw error;
    }
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Get Tebra proxy configuration from Google Secret Manager
      console.log('Loading Tebra proxy configuration from Google Secret Manager...');
      
      // Check if we have the proxy URL in GSM, otherwise use the known URL
      try {
        this.proxyUrl = await this.getSecret('tebra-proxy-url');
      } catch (error) {
        console.log('tebra-proxy-url not found in GSM, using default URL');
        this.proxyUrl = 'https://tebra-proxy-623450773640.us-central1.run.app';
      }

      // Get the API key from GSM
      this.proxyApiKey = await this.getSecret('tebra-proxy-api-key');

      if (!this.proxyUrl || !this.proxyApiKey) {
        throw new Error('Missing Tebra proxy configuration from Google Secret Manager');
      }

      // Validate proxy URL
      const url = new URL(this.proxyUrl);
      if (url.protocol !== 'https:') {
        throw new Error('Tebra proxy URL must use HTTPS');
      }

      // Initialize Google Auth for Cloud Run authentication
      this.auth = new GoogleAuth();
      this.authClient = await this.auth.getIdTokenClient(this.proxyUrl);
      console.log('Google Auth initialized for Cloud Run authentication');

      this.initialized = true;
      console.log('Tebra proxy client initialized successfully with GSM and Google Auth');
    } catch (error) {
      console.error('Failed to initialize Tebra proxy client:', error);
      throw new Error(`Failed to initialize Tebra proxy client: ${error.message}`);
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    await this.initialize();

    const url = `${this.proxyUrl}/${endpoint}`;
    
    try {
      console.log(`[TebraProxy] 🌐 Making authenticated request to Tebra proxy: ${method} ${endpoint}`);
      
      // Use Google Auth client to make the request with ID token
      const requestOptions = {
        url,
        method,
        headers: {
          'X-API-Key': this.proxyApiKey,
          'Content-Type': 'application/json',
        },
      };

      if (data && method !== 'GET') {
        requestOptions.data = data;
      }

      const response = await this.authClient.request(requestOptions);
      console.log(`[TebraProxy] 📡 HTTP Response status: ${response.status}`);
      
      // The google-auth-library client automatically parses JSON responses
      const result = response.data;
      console.log('[TebraProxy] 📥 Response received, processing...');

      if (response.status < 200 || response.status >= 300) {
        console.error(`[TebraProxy] ❌ HTTP Error: ${response.status}`, result);
        throw new Error(result?.error || `HTTP ${response.status}`);
      }

      if (!result.success) {
        console.error('[TebraProxy] ❌ Proxy reported failure:', result);
        throw new Error(result.error || 'Request failed');
      }

      console.log('[TebraProxy] ✅ Request completed successfully');
      return result.data;
    } catch (error) {
      console.error('Tebra proxy request failed:', error.message);
      // Provide more specific error information for debugging
      if (error.response) {
        console.error(`[TebraProxy] Response status: ${error.response.status}`);
        console.error(`[TebraProxy] Response data:`, error.response.data);
      }
      throw new Error(`Tebra API request failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      console.log('[TebraProxy] 🔍 Starting connection test...');
      const result = await this.makeRequest('ping');
      console.log('[TebraProxy] ✅ Connection test successful, result:', JSON.stringify(result).slice(0, 200));
      return result.curl_ok === true;
    } catch (error) {
      console.error('[TebraProxy] ❌ Connection test failed:', error.message);
      if (error.response) {
        console.error('[TebraProxy] Error response status:', error.response.status);
        console.error('[TebraProxy] Error response data:', JSON.stringify(error.response.data).slice(0, 200));
      }
      return false;
    }
  }

  async getAppointments(fromDate, toDate) {
    // Validate date parameters
    if (!fromDate || !toDate) {
      throw new Error('Both fromDate and toDate are required');
    }
    if (new Date(fromDate) > new Date(toDate)) {
      throw new Error('fromDate must be before or equal to toDate');
    }
    
    console.log(`[TebraProxy] 🔍 Getting appointments for ${fromDate} to ${toDate}`);
    const result = await this.makeRequest('appointments', 'POST', { fromDate, toDate });
    console.log(`[TebraProxy] 📋 getAppointments result type:`, typeof result);
    console.log(`[TebraProxy] 📋 getAppointments result:`, JSON.stringify(result, null, 2));
    console.log(`[TebraProxy] 📋 getAppointments result.appointments:`, result.appointments);
    console.log(`[TebraProxy] 📋 getAppointments result.appointments type:`, typeof result.appointments);
    console.log(`[TebraProxy] 📋 getAppointments result.appointments length:`, result.appointments?.length);
    
    // Return the appointments array directly since result is already the data object
    return result.appointments || [];
  }

  async getPatientById(patientId) {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    // Sanitize patientId to prevent injection
    const sanitizedId = String(patientId).replace(/[^a-zA-Z0-9-]/g, '');
    const result = await this.makeRequest(`patients/${sanitizedId}`);
     return result.patient;
  }

  async searchPatients(searchCriteria) {
    const result = await this.makeRequest('patients', 'POST', searchCriteria);
    return result.patients || [];
  }

  async getProviders() {
    const result = await this.makeRequest('providers');
    return result.providers || [];
  }

  async getPractices() {
    const result = await this.makeRequest('practices');
    return result.practices || [];
  }
}

// Create singleton instance
const tebraProxyClient = new TebraProxyClient();

module.exports = { tebraProxyClient };