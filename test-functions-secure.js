// Secure test script for production Firebase Functions
// This uses proper authentication via Firebase Admin SDK

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize admin with Application Default Credentials
admin.initializeApp();

async function testGetSecretFunction() {
  try {
    console.log('Testing getSecret function with proper authentication...\n');
    
    // Create a custom token for testing
    const customToken = await admin.auth().createCustomToken('test-user-id');
    
    // Get the function URL
    const functionUrl = 'https://getsecret-xccvzgogwa-uc.a.run.app';
    
    // Test the function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customToken}`
      },
      body: JSON.stringify({
        data: {
          secretKey: 'TEBRA_PROXY_API_KEY'
        }
      })
    });
    
    const result = await response.json();
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Error testing function:', error);
  }
}

// Instructions for proper testing
console.log('For production testing, you should:\n');
console.log('1. Use the Firebase SDK from a client app with proper authentication');
console.log('2. Or create a service account and use it to authenticate');
console.log('3. Never bypass authentication in production\n');

console.log('To test tebraTestConnection (if it allows unauthenticated access):');
console.log('gcloud functions call tebraTestConnection --region=us-central1 --gen2\n');

// Uncomment to run the test (requires proper setup)
// testGetSecretFunction();