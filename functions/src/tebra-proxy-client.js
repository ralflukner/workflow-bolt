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

    // Lazy-load GSM client to avoid cold-start cost when env vars are already provided
    this.secretClient = null;
  }

  async initialize() {
    if (this.initialized) return;

    // 1️⃣  New preferred path: env vars
    this.cloudRunUrl     = process.env.TEBRA_CLOUD_RUN_URL;
    this.internalApiKey  = process.env.TEBRA_INTERNAL_API_KEY;

    // 2️⃣  Skip functions.config() for v2 functions
    // functions.config() is no longer available in Cloud Functions for Firebase v2

    // 3️⃣  Ultimate fallback – fetch from Google Secret-Manager (keeps values out of env vars)
    if (!this.cloudRunUrl || !this.internalApiKey) {
      try {
        if (!this.secretClient) {
          const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
          this.secretClient = new SecretManagerServiceClient();
        }

        const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
        if (!projectId) throw new Error('GCP project ID not set');

        const fetchSecret = async (secretName) => {
          const [version] = await this.secretClient.accessSecretVersion({
            name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
          });
          return version.payload?.data?.toString();
        };

        if (!this.cloudRunUrl) {
          this.cloudRunUrl = await fetchSecret('tebra-cloud-run-url');
        }
        if (!this.internalApiKey) {
          this.internalApiKey = await fetchSecret('tebra-internal-api-key');
        }
      } catch (err) {
        console.error('Secret Manager fallback failed:', err);
      }
    }

    if (!this.cloudRunUrl || !this.internalApiKey) {
      throw new Error('Missing Tebra Cloud-Run configuration (env vars or functions.config)');
    }

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
    console.log(`Cloud Run URL: ${this.cloudRunUrl}`);
    console.log(`Internal API Key: ${this.internalApiKey ? '[SET]' : '[NOT SET]'}`);
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
      console.log('[TebraProxyClient] Testing connection...');
      const result = await this.makeRequest('getProviders');
      console.log('[TebraProxyClient] Test connection result:', result ? 'Success' : 'Failed');
      return Array.isArray(result);
    } catch (e) {
      console.error('[TebraProxyClient] Test connection error:', e.message);
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