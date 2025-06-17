const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

async function testCloudRunDirectly() {
  console.log('Testing Cloud Run service directly...\n');
  
  const cloudRunUrl = 'https://tebra-php-api-xccvzgogwa-uc.a.run.app';
  const internalApiKey = process.env.TEBRA_INTERNAL_API_KEY ?? (() => {
  throw new Error('TEBRA_INTERNAL_API_KEY env var missing');
})();
  
  try {
    // First test: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${cloudRunUrl}/health`);
    const healthData = await healthResponse.text();
    console.log(`Health check response (${healthResponse.status}):`, healthData);
    
    // Second test: Test with API key
    console.log('\n2. Testing with API key and getProviders action...');
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(cloudRunUrl);
    
    const response = await client.request({
      url: cloudRunUrl,
      method: 'POST',
      headers: {
        'X-API-Key': internalApiKey,
        'Content-Type': 'application/json',
      },
      data: { action: 'getProviders', params: {} }
    });
    
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function debugTebraProxyClient() {
  console.log('\n3. Simulating TebraProxyClient behavior...');
  
  // Check environment variables
  console.log('Environment variables (redacted):');
  const redact = (val) => (val ? '[SET]' : 'NOT SET');
  console.log('- TEBRA_CLOUD_RUN_URL:', redact(process.env.TEBRA_CLOUD_RUN_URL));
  console.log('- TEBRA_INTERNAL_API_KEY:', redact(process.env.TEBRA_INTERNAL_API_KEY));
  console.log('- GCP_PROJECT:', redact(process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT));
  
  // Simulate the TebraProxyClient initialization
  const cloudRunUrl = process.env.TEBRA_CLOUD_RUN_URL || 'https://tebra-php-api-xccvzgogwa-uc.a.run.app';
  const internalApiKey = process.env.TEBRA_INTERNAL_API_KEY ?? (() => {
  throw new Error('TEBRA_INTERNAL_API_KEY env var missing');
})();
  
  console.log('\nUsing:');
  console.log('- Cloud Run URL:', cloudRunUrl);
  console.log('- Internal API Key:', internalApiKey ? '[SET]' : '[NOT SET]');
  
  try {
    // Test URL validation
    const url = new URL(cloudRunUrl);
    console.log('- URL protocol:', url.protocol);
    console.log('- URL is HTTPS:', url.protocol === 'https:');
  } catch (error) {
    console.error('Invalid URL:', error.message);
  }
}

// Run tests
(async () => {
  await testCloudRunDirectly();
  await debugTebraProxyClient();
})();