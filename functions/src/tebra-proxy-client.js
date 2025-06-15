const fetch = require('node-fetch');
const { GoogleAuth } = require('google-auth-library');
const { DebugLogger } = require('./debug-logger');
// const functions = require('firebase-functions'); // Not needed for v2 functions

// Shared initialization promise to prevent parallel secret fetches
let sharedInitializationPromise = null;
let sharedSecrets = null;

class TebraProxyClient {
  constructor() {
    this.initialized = false;
    this.cloudRunUrl = null;
    this.internalApiKey = null;
    this.auth = null;
    this.authClient = null;
    this.logger = new DebugLogger('TebraProxyClient');

    // Lazy-load GSM client to avoid cold-start cost when env vars are already provided
    this.secretClient = null;
    
    this.logger.info('TebraProxyClient instance created');
  }

  async initialize() {
    if (this.initialized) return;

    // Use shared secrets if already fetched
    if (sharedSecrets) {
      this.cloudRunUrl = sharedSecrets.cloudRunUrl;
      this.internalApiKey = sharedSecrets.internalApiKey;
    } else {
      // Ensure only one initialization happens at a time
      if (!sharedInitializationPromise) {
        sharedInitializationPromise = this._fetchSecretsOnce();
      }
      
      const secrets = await sharedInitializationPromise;
      this.cloudRunUrl = secrets.cloudRunUrl;
      this.internalApiKey = secrets.internalApiKey;
    }

    if (!this.cloudRunUrl || !this.internalApiKey) {
      throw new Error('Missing Tebra Cloud-Run configuration (GSM secrets or env vars)');
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

  /**
   * Fetch secrets only once and cache them for all instances
   */
  async _fetchSecretsOnce() {
    console.log('[TebraProxyClient] Fetching secrets (shared initialization)');
    
    let cloudRunUrl = null;
    let internalApiKey = null;

    // 1️⃣  Preferred path: Google Secret Manager
    try {
      if (!this.secretClient) {
        const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
        this.secretClient = new SecretManagerServiceClient();
      }

      const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';
      console.log(`[TebraProxyClient] Using project ID: ${projectId}`);

      const fetchSecret = async (secretName) => {
        try {
          const [version] = await this.secretClient.accessSecretVersion({
            name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
          });
          return version.payload?.data?.toString();
        } catch (err) {
          console.error(`[TebraProxyClient] Failed to fetch secret ${secretName}:`, err.message);
          return null;
        }
      };

      cloudRunUrl = await fetchSecret('TEBRA_CLOUD_RUN_URL');
      internalApiKey = await fetchSecret('TEBRA_INTERNAL_API_KEY');
      
      console.log(`[TebraProxyClient] Secrets loaded from GSM - Cloud Run URL: ${cloudRunUrl ? '[SET]' : '[NOT SET]'}, API Key: ${internalApiKey ? '[SET]' : '[NOT SET]'}`);
    } catch (err) {
      console.error('[TebraProxyClient] Secret Manager initialization failed:', err);
    }

    // 2️⃣  Fallback to env vars if GSM fails
    if (!cloudRunUrl || !internalApiKey) {
      cloudRunUrl = cloudRunUrl || process.env.TEBRA_CLOUD_RUN_URL;
      internalApiKey = internalApiKey || process.env.TEBRA_INTERNAL_API_KEY;
      console.log(`[TebraProxyClient] After env var fallback - Cloud Run URL: ${cloudRunUrl ? '[SET]' : '[NOT SET]'}, API Key: ${internalApiKey ? '[SET]' : '[NOT SET]'}`);
    }

    // Cache the secrets for future instances
    sharedSecrets = { cloudRunUrl, internalApiKey };
    
    return sharedSecrets;
  }

  async makeRequest(action, params = {}) {
    const requestLogger = this.logger.child('makeRequest');
    const timer = requestLogger.time(`${action} request`);
    
    requestLogger.info(`Starting request`, { 
      action, 
      paramsKeys: Object.keys(params),
      paramsSize: JSON.stringify(params).length 
    });

    try {
      await this.initialize();
      requestLogger.info('Initialization completed');

      // Prepare request options
      const requestOptions = {
        url: this.cloudRunUrl,
        method: 'POST',
        headers: {
          'X-API-Key': this.internalApiKey,
          'Content-Type': 'application/json',
        },
        data: { action, params }
      };

      // Log the API call (headers will be sanitized)
      requestLogger.apiCall('POST', this.cloudRunUrl, requestOptions.headers, requestOptions.data);

      // Make the request using authClient for Google Auth + API key for internal auth
      const requestStart = Date.now();
      const response = await this.authClient.request(requestOptions);
      const requestDuration = Date.now() - requestStart;
      
      requestLogger.info(`HTTP request completed`, { 
        status: response.status,
        durationMs: requestDuration,
        responseSize: response.data ? JSON.stringify(response.data).length : 0
      });

      let result = response.data;
      
      // Handle double-JSON encoding from Cloud Run
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
          requestLogger.info(`Parsed JSON string response`, {
            originalType: 'string',
            parsedKeys: Object.keys(result),
            success: result.success
          });
        } catch (parseError) {
          requestLogger.error(`Failed to parse JSON response`, {
            responseData: result,
            parseError: parseError.message
          });
          throw new Error(`Invalid JSON response from Cloud Run: ${parseError.message}`);
        }
      } else {
        requestLogger.info(`Response already parsed`, {
          type: typeof result,
          keys: result ? Object.keys(result) : 'null',
          success: result?.success
        });
      }
      
      // Log the API response
      requestLogger.apiResponse(response.status, result);

      // Check for HTTP errors
      if (response.status < 200 || response.status >= 300) {
        requestLogger.error(`HTTP error response`, {
          status: response.status,
          error: result?.error,
          fullResponse: result
        });
        throw new Error(result?.error || `HTTP ${response.status}`);
      }

      // Check for application-level errors
      // Handle Cloud Run response structure: { success: true, data: { success: true, data: TebraResponse } }
      if (result.success === false) {
        requestLogger.error(`Application error in response`, {
          success: result.success,
          error: result.error,
          data: result.data,
          fullResponse: JSON.stringify(result)
        });
        
        // Special handling for known Tebra errors
        if (result.error && result.error.includes('InternalServiceFault')) {
          requestLogger.error(`Tebra InternalServiceFault detected`, {
            action,
            params,
            tebraError: result.error,
            timestamp: new Date().toISOString()
          });
        }
        
        throw new Error(result.error || 'Request failed');
      }


      // Extract the actual Tebra response data
      const tebraResponse = result.data;
      
      // Check if the inner Tebra response indicates failure
      if (!tebraResponse || tebraResponse.success === false) {
        requestLogger.error(`Tebra service error`, {
          tebraSuccess: tebraResponse?.success,
          tebraError: tebraResponse?.error,
          fullTebraResponse: JSON.stringify(tebraResponse)
        });
        throw new Error(tebraResponse?.error || 'Tebra service error');
      }

      // Check for Tebra-specific authentication/authorization failures
      const tebraData = tebraResponse.data;
      if (tebraData) {
        // Check for Tebra SOAP response errors
        const soapResult = Object.values(tebraData)[0]; // GetProvidersResult, GetPatientsResult, etc.
        if (soapResult?.SecurityResponse) {
          const security = soapResult.SecurityResponse;
          if (!security.SecurityResultSuccess || !security.Authenticated || !security.Authorized) {
            requestLogger.error(`Tebra authentication/authorization failed`, {
              authenticated: security.Authenticated,
              authorized: security.Authorized,
              securityResult: security.SecurityResult,
              customerKeyValid: security.CustomerKeyValid
            });
            throw new Error(`Tebra auth failed: ${security.SecurityResult || 'Unknown error'}`);
          }
        }
        
        // Check for Tebra SOAP errors
        if (soapResult?.ErrorResponse?.IsError) {
          requestLogger.error(`Tebra SOAP error`, {
            errorMessage: soapResult.ErrorResponse.ErrorMessage,
            stackTrace: soapResult.ErrorResponse.StackTrace
          });
          throw new Error(`Tebra SOAP error: ${soapResult.ErrorResponse.ErrorMessage}`);
        }
      }

      // Return only the actual SOAP payload (inner data) to maintain compatibility with existing callers
      const payload = tebraResponse.data;

      requestLogger.info(`Request completed successfully`, {
        action,
        dataSize: payload ? JSON.stringify(payload).length : 0,
        hasData: !!payload
      });
      
      timer.end();
      return payload;
      
    } catch (error) {
      timer.end();
      
      requestLogger.error(`Request failed`, {
        action,
        error: error.message,
        stack: error.stack,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        isNetworkError: !error.response,
        isHttpError: !!error.response,
        isTebraError: error.message.includes('InternalServiceFault')
      });
      
      // Enhanced error context
      const enhancedError = new Error(`Tebra API request failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.action = action;
      enhancedError.params = params;
      enhancedError.correlationId = requestLogger.correlationId;
      
      throw enhancedError;
    }
  }

  async testConnection() {
    try {
      console.log('[TebraProxyClient] Testing connection...');
      const payload = await this.makeRequest('getProviders');
      console.log('[TebraProxyClient] Test connection result:', payload ? 'Success' : 'Failed');
      
      // Check if we got valid provider data in the SOAP payload
      const hasProviderData = payload?.GetProvidersResult?.Providers?.ProviderData;
      return !!hasProviderData;
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

// Test function for connection verification
async function tebraTestConnection() {
  try {
    await tebraProxyClient.initialize();
    const result = await tebraProxyClient.getProviders();
    return {
      success: true,
      message: 'Tebra connection test successful',
      data: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: 'Tebra connection test failed: ' + error.message,
      error: error.stack,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { tebraProxyClient, tebraTestConnection };