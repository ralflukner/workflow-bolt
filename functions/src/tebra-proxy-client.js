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
    this.logger.info('Google Auth initialized for Cloud Run authentication');

    this.initialized = true;
    this.logger.info('Tebra Cloud Run client initialized successfully');
    this.logger.info(`Cloud Run URL: ${this.cloudRunUrl}`);
    this.logger.info(`Internal API Key: ${this.internalApiKey ? '[SET]' : '[NOT SET]'}`);
  }

  /**
   * Fetch secrets only once and cache them for all instances
   */
  async _fetchSecretsOnce() {
    this.logger.info('TEMPORARY: Using hardcoded Cloud Run configuration');
    
    // TEMPORARY FIX: Hardcode the working PHP Cloud Run service
    const cloudRunUrl = 'https://tebra-php-api-623450773640.us-central1.run.app';
    const internalApiKey = 'UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y=';
    
    this.logger.info(`Using hardcoded Cloud Run URL: ${cloudRunUrl}`);
    this.logger.info(`Using hardcoded API Key: ${internalApiKey ? '[SET]' : '[NOT SET]'}`);

    // Cache the secrets for future instances
    sharedSecrets = { cloudRunUrl, internalApiKey };
    
    return sharedSecrets;
  }

  async makeRequest(action, params = {}) {
    // 🚫 Do NOT run syncSchedule inside Node. All EHR-related calls must go
    // through the PHP Cloud-Run service for HIPAA-compliant SOAP handling.
    // Therefore we forward *all* actions (including "syncSchedule") to
    // Cloud Run below.

    const requestLogger = this.logger.child('makeRequest');
    const timer = requestLogger.time(`${action} request`);
    
    requestLogger.info(`Starting request`, { 
      action, 
      paramsKeys: Object.keys(params),
      paramsSize: JSON.stringify(params).length 
    });

    try {
      // Lazy load OpenTelemetry to prevent startup blocking
      let runWithCorrelation;
      try {
        const otel = require('../otel-init');
        runWithCorrelation = otel.runWithCorrelation;
      } catch (otelError) {
        // Fallback if OpenTelemetry fails to load
        console.warn('OpenTelemetry not available, falling back to direct execution:', otelError.message);
        runWithCorrelation = async (correlationId, fn) => await fn();
      }

      return await runWithCorrelation(this.logger.correlationId, async () => {
        await this.initialize();
        requestLogger.info('Initialization completed');

        // Prepare request options
        const requestOptions = {
          url: this.cloudRunUrl,
          method: 'POST',
          headers: {
            'X-API-Key': this.internalApiKey,
            'Content-Type': 'application/json',
            'X-Correlation-Id': this.logger.correlationId,
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
            // Re-throw with enhanced context
            throw Object.assign(parseError, {
              responseData: result,
              action: action
            });
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
          throw Object.assign(
            new Error(result?.error || `HTTP ${response.status}`),
            { status: response.status }
          );
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
          
          throw Object.assign(
            new Error(result.error || 'Request failed'),
            { type: 'APPLICATION_ERROR' }
          );
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
          throw Object.assign(
            new Error(tebraResponse?.error || 'Tebra service error'),
            { type: 'TEBRA_SERVICE_ERROR' }
          );
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
              throw Object.assign(
                new Error(`Tebra auth failed: ${security.SecurityResult || 'Unknown error'}`),
                { type: 'TEBRA_AUTH_ERROR' }
              );
            }
          }
          
          // Check for Tebra SOAP errors
          if (soapResult?.ErrorResponse?.IsError) {
            requestLogger.error(`Tebra SOAP error`, {
              errorMessage: soapResult.ErrorResponse.ErrorMessage,
              stackTrace: soapResult.ErrorResponse.StackTrace
            });
            throw Object.assign(
              new Error(`Tebra SOAP error: ${soapResult.ErrorResponse.ErrorMessage}`),
              { type: 'TEBRA_SOAP_ERROR' }
            );
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
      });
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
      throw Object.assign(
        new Error(`Tebra API request failed: ${error.message}`),
        {
          originalError: error,
          action: action,
          params: params,
          correlationId: requestLogger.correlationId
        }
      );
    }
  }

  async testConnection() {
    try {
      this.logger.info('Testing connection...');
      const payload = await this.makeRequest('getProviders');
      this.logger.info('Test connection result:', payload ? 'Success' : 'Failed');
      
      // Check if we got valid provider data in the SOAP payload
      const hasProviderData = payload?.GetProvidersResult?.Providers?.ProviderData;
      return !!hasProviderData;
    } catch (e) {
      this.logger.error('Test connection error:', e.message);
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
    
    this.logger.info(`Getting appointments for ${fromDate} to ${toDate}`);
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

  async getPatientById(patientId) {
    if (!patientId) {
      throw new Error('patientId is required');
    }
    this.logger.info(`Getting patient by ID: ${patientId}`);
    return this.makeRequest('getPatientById', { patientId });
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