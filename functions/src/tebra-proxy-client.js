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
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }

      return result.data;
    } catch (error) {
      console.error('Tebra proxy request failed:', error);
      throw error;
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
    return this.makeRequest('appointments', 'POST', { fromDate, toDate });
  }

  async getPatientById(patientId) {
    const result = await this.makeRequest(`patients/${patientId}`);
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