const fetch = require('node-fetch');

async function testPhpApiAuth() {
  const apiKey = process.env.VITE_TEBRA_PROXY_API_KEY || '9c2ea0249c...'; // Use your actual key
  const url = 'https://tebra-php-api-xccvzgogwa-uc.a.run.app';
  
  console.log('Testing PHP API authentication methods...\n');
  console.log(`Using API Key: ${apiKey.substring(0, 10)}... (length: ${apiKey.length})\n`);
  
  // Test 1: Health check (no auth)
  console.log('1. Testing health endpoint (no auth):');
  try {
    const response = await fetch(url);
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Body: ${text}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }
  
  // Test 2: API endpoint with X-API-Key header
  console.log('2. Testing API endpoint with X-API-Key:');
  try {
    const response = await fetch(`${url}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        action: 'testConnection',
        params: {}
      })
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Body: ${text}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }
  
  // Test 3: Try with Authorization Bearer
  console.log('3. Testing API endpoint with Authorization Bearer:');
  try {
    const response = await fetch(`${url}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        action: 'testConnection',
        params: {}
      })
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Body: ${text}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }
  
  // Test 4: Try without any auth
  console.log('4. Testing API endpoint without auth:');
  try {
    const response = await fetch(`${url}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'testConnection',
        params: {}
      })
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Body: ${text}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 5: Try root path instead of /api
  console.log('5. Testing root path with X-API-Key:');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        action: 'testConnection',
        params: {}
      })
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Body: ${text}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 6: Check if there's a different endpoint structure
  console.log('6. Testing /index.php with X-API-Key:');
  try {
    const response = await fetch(`${url}/index.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        action: 'testConnection',
        params: {}
      })
    });
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Body: ${text}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }
}

// Load environment variables if .env exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use environment variables directly
}

testPhpApiAuth();