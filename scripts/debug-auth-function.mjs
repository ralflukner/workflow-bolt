#!/usr/bin/env node

/**
 * Debug script for Firebase Auth function issues
 */

import https from 'https';

// Function URL
const FUNCTION_URL = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/exchangeAuth0Token';

console.log('🔍 Debugging Firebase Auth Function...\n');

// Test 1: Basic connectivity
console.log('1️⃣ Testing basic connectivity...');
const testBasicConnectivity = () => {
  return new Promise((resolve) => {
    https.get(FUNCTION_URL, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, res.headers);
      resolve();
    }).on('error', (err) => {
      console.log(`   Error: ${err.message}`);
      resolve();
    });
  });
};

// Test 2: OPTIONS request (CORS preflight)
console.log('\n2️⃣ Testing OPTIONS request (CORS preflight)...');
const testOptionsRequest = () => {
  return new Promise((resolve) => {
    const options = {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const url = new URL(FUNCTION_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: options.method,
      headers: options.headers
    }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   CORS Headers:`);
      console.log(`   - Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
      console.log(`   - Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
      console.log(`   - Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
      resolve();
    });

    req.on('error', (err) => {
      console.log(`   Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
};

// Test 3: POST request with Firebase callable format
console.log('\n3️⃣ Testing POST request (Firebase callable format)...');
const testPostRequest = () => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      data: {
        auth0Token: 'test-token'
      }
    });

    const url = new URL(FUNCTION_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Origin': 'http://localhost:5173'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`   Response: ${body}`);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   Error: ${err.message}`);
      resolve();
    });

    req.write(data);
    req.end();
  });
};

// Test 4: Direct Cloud Run URL
console.log('\n4️⃣ Testing direct Cloud Run URL...');
const testCloudRunUrl = () => {
  return new Promise((resolve) => {
    const cloudRunUrl = 'https://exchangeauth0token-xccvzgogwa-uc.a.run.app';
    https.get(cloudRunUrl, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      resolve();
    }).on('error', (err) => {
      console.log(`   Error: ${err.message}`);
      resolve();
    });
  });
};

// Run all tests
async function runTests() {
  await testBasicConnectivity();
  await testOptionsRequest();
  await testPostRequest();
  await testCloudRunUrl();
  
  console.log('\n✅ Debug complete!');
  console.log('\n📋 Recommended fixes:');
  console.log('1. Check if function is cold-starting (may need warm-up)');
  console.log('2. Verify Auth0 secrets are accessible');
  console.log('3. Check function logs: gcloud run services logs read exchangeauth0token --region=us-central1');
  console.log('4. Consider adding health check endpoint to function');
}

runTests();