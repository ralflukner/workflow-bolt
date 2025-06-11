const fetch = require('node-fetch');

class TebraProxyClient {
  constructor() {
    this.initialized = false;
    this.proxyUrl = null;
    this.proxyApiKey = null;
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

    this.initialized = true;
    console.log('Tebra proxy client initialized successfully');
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    await this.initialize();

    const url = `${this.proxyUrl}/${endpoint}`;
    const options = {
      method,
      headers: {
        'X-API-Key': this.proxyApiKey,
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      console.log(`Making request to Tebra proxy: ${method} ${url}`);
      if (data) {
        console.log('Request data:', JSON.stringify(data));
      }
      const response = await fetch(url, options);
      const result = await response.json();
      console.log('Proxy response:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }

      return result.data;
} catch (error) {
  console.error('Tebra proxy request failed:', error.message);
  // Throw a sanitized error to prevent information leakage
  throw new Error(`Tebra API request failed: ${error.message}`);
 }
  }

  async testConnection() {
    try {
      const result = await this.makeRequest('health');
      return result.status === 'healthy';
    } catch (error) {
      console.error('Connection test failed:', error);
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
   return this.makeRequest('appointments', 'POST', { fromDate, toDate });
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