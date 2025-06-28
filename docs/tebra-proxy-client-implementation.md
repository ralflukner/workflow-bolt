# Tebra Proxy Client Implementation Details

## Overview
The `tebra-proxy-client.js` file implements a Node.js client for communicating with the Tebra PHP API hosted on Google Cloud Run. It handles authentication, request formatting, and error handling.

## Key Features
1. **Dual Authentication**: Supports both Google Identity Tokens and API Key authentication
2. **Singleton Pattern**: Single instance shared across all function invocations
3. **Error Handling**: Comprehensive error logging and debugging
4. **Environment Configuration**: Flexible configuration via environment variables

## Implementation Details

### Initialization
```javascript
class TebraProxyClient {
  constructor() {
    this.initialized = false;
    this.cloudRunUrl = process.env.TEBRA_CLOUD_RUN_URL || 'https://tebra-php-api-623450773640.us-central1.run.app';
    this.auth = null;
    this.internalApiKey = process.env.TEBRA_INTERNAL_API_KEY;
  }

  async initialize() {
    // Validate HTTPS requirement
    const url = new URL(this.cloudRunUrl);
    if (url.protocol !== 'https:') {
      throw new Error('Tebra Cloud Run URL must use HTTPS');
    }

    // Setup Google Auth with proper credentials
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS?.startsWith('/') 
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS 
      : process.env.GOOGLE_APPLICATION_CREDENTIALS 
        ? require('path').resolve(__dirname, '../..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : undefined;
    
    this.auth = new GoogleAuth({ keyFilename });
    this.initialized = true;
  }
}
```

### Authentication Flow
1. **Identity Token Generation**: Creates Google Identity Token for Cloud Run authentication
2. **API Key Header**: Adds X-API-Key header when configured
3. **Request Headers**: Combines both authentication methods

```javascript
async makeAuthenticatedRequest(endpoint, method = 'POST', data = null) {
  await this.initialize();
  
  // Get ID token for Cloud Run
  const client = await this.auth.getIdTokenClient(this.cloudRunUrl);
  
  const requestConfig = {
    url: `${this.cloudRunUrl}/${endpoint}`,
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Add API key if configured
  if (this.internalApiKey) {
    requestConfig.headers['X-API-Key'] = this.internalApiKey;
  }
  
  if (data) {
    requestConfig.data = data;
  }
  
  const response = await client.request(requestConfig);
  return { status: response.status, data: response.data };
}
```

### API Methods

#### testConnection()
Tests connectivity to the Tebra API by fetching providers list.
```javascript
async testConnection() {
  try {
    const response = await this.makeRequest('getProviders');
    return response.status === 200;
  } catch (e) {
    console.error('Connection test failed:', e.message);
    return false;
  }
}
```

#### getAppointments(fromDate, toDate)
Fetches appointments within a date range.
- Validates date parameters
- Returns appointment data from Tebra

#### getProviders()
Retrieves list of healthcare providers.

#### getPatientById(patientId)
Fetches a specific patient's information.

#### searchPatients(lastName)
Searches for patients by last name.

## Error Handling

The client provides detailed error information for debugging:
```javascript
catch (error) {
  console.error('Tebra Cloud Run request failed:', error.message);
  console.error('[TebraCloudRun] Full error:', error);
  
  if (error.response) {
    console.log(`[TebraCloudRun] Response status: ${error.response.status}`);
    console.log(`[TebraCloudRun] Response data:`, error.response.data);
    console.log(`[TebraCloudRun] Response headers:`, error.response.headers);
  }
  
  throw error;
}
```

## Environment Variables Required
- `TEBRA_CLOUD_RUN_URL`: The Cloud Run service URL
- `TEBRA_INTERNAL_API_KEY`: API key for additional authentication
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account JSON file

## Common Modifications

### Adding a New API Method
```javascript
async getNewEndpoint(param1, param2) {
  // Validate parameters
  if (!param1 || !param2) {
    throw new Error('Both parameters are required');
  }
  
  // Make API request
  const response = await this.makeRequest('newEndpoint', { param1, param2 });
  return response.data;
}
```

### Changing Request Format
All requests currently use POST with JSON body:
```javascript
// Current format
method = 'POST';
data = { action, params };

// To support GET requests, modify makeRequest():
if (method === 'GET' && Object.keys(params).length > 0) {
  const queryString = new URLSearchParams(params).toString();
  return this.makeAuthenticatedRequest(`${endpoint}?${queryString}`, 'GET', null);
}
```

## Debugging Tips
1. Check initialization logs for credential path
2. Verify API key is being sent in headers
3. Look for 401/403 errors indicating auth issues
4. Check response content-type (HTML usually means error)
5. Use detailed error logging to diagnose issues