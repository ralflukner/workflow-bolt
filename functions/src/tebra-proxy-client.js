const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');

class TebraProxyClient {
  constructor() {
    this.initialized = false;
    this.proxyUrl = null;
    this.proxyApiKey = null;
    this.auth = null;
    this.authClient = null;
  }

  async initialize() {
    if (this.initialized) return;

    // Use environment variables for Firebase Functions v2
    this.proxyUrl = process.env.TEBRA_PROXY_URL;
    this.proxyApiKey = process.env.TEBRA_PROXY_API_KEY;

    // Validate proxy URL
    if (this.proxyUrl) {
      try {
        const url = new URL(this.proxyUrl);
        if (url.protocol !== 'https:') {
          throw new Error('Tebra proxy URL must use HTTPS');
        }
      } catch (error) {
        throw new Error('Invalid Tebra proxy URL format');
      }
    }

    if (!this.proxyUrl || !this.proxyApiKey) {
      throw new Error('Missing Tebra proxy configuration in environment variables');
    }

    // Initialize Google Auth for Cloud Run authentication
    try {
      this.auth = new GoogleAuth();
      this.authClient = await this.auth.getIdTokenClient(this.proxyUrl);
      console.log('Google Auth initialized for Cloud Run authentication');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw new Error('Failed to initialize Google Auth for Cloud Run');
    }

    this.initialized = true;
    console.log('Tebra proxy client initialized successfully with Google Auth');
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
      const result = await this.makeRequest('health');
      console.log('[TebraProxy] ✅ Connection test successful, result:', JSON.stringify(result).slice(0, 200));
      return result.status === 'healthy';
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