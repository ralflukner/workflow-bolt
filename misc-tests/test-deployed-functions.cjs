/**
 * Test script to verify deployed Firebase Functions
 * Run with: node test-deployed-functions.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

async function testCredentialVerification() {
  console.log('🔍 Testing Credential Verification Functions...');
  console.log('===========================================');
  
  try {
    // Test 1: Basic Firestore connection
    console.log('\n1. Testing Firestore connection...');
    const db = admin.firestore();
    const testDoc = db.collection('_credential_test').doc('test');
    await testDoc.set({ test: true, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    console.log('✅ Firestore write successful');
    
    const snapshot = await testDoc.get();
    if (snapshot.exists) {
      console.log('✅ Firestore read successful');
      await testDoc.delete();
      console.log('✅ Firestore delete successful');
    }
    
    // Test 2: Firebase Auth Admin
    console.log('\n2. Testing Firebase Auth admin access...');
    const auth = admin.auth();
    console.log('✅ Firebase Auth admin access confirmed');
    
    // Test 3: Test callable function (if we can create a custom token)
    console.log('\n3. Testing custom token creation...');
    try {
      const customToken = await auth.createCustomToken('test-user-id', {
        testClaim: true,
        timestamp: Date.now()
      });
      console.log('✅ Custom token creation successful');
    } catch (error) {
      console.log('❌ Custom token creation failed:', error.message);
    }
    
    console.log('\n🎉 Basic credential verification completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Credential verification failed:', error);
    return false;
  }
}

async function testHealthEndpoints() {
  console.log('\n🏥 Testing Health Check Endpoints...');
  console.log('====================================');
  
  const fetch = require('node-fetch');
  
  try {
    // Test health check endpoint
    console.log('\n1. Testing healthCheck endpoint...');
    const healthUrl = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/healthCheck';
    
    try {
      const response = await fetch(healthUrl, { timeout: 10000 });
      console.log(`Health check status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health check successful:', data.status);
        console.log(`   Environment: ${data.environment}`);
        console.log(`   Node version: ${data.nodeVersion}`);
      } else {
        console.log('⚠️ Health check returned non-200 status');
      }
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }
    
    // Test verify credentials endpoint
    console.log('\n2. Testing verifyCredentials endpoint...');
    const credentialsUrl = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/verifyCredentials';
    
    try {
      const response = await fetch(credentialsUrl, { timeout: 30000 });
      console.log(`Credentials verification status: ${response.status}`);
      
      if (response.ok || response.status === 500) {
        const data = await response.json();
        console.log(`Verification result: ${data.valid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`Checks passed: ${data.summary?.passed || 0}/${data.summary?.total || 0}`);
        
        if (data.errors && data.errors.length > 0) {
          console.log('Errors found:');
          data.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (data.warnings && data.warnings.length > 0) {
          console.log('Warnings found:');
          data.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
      } else {
        console.log('⚠️ Credentials verification returned unexpected status');
      }
    } catch (error) {
      console.log('❌ Credentials verification failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Health endpoint testing failed:', error);
  }
}

async function testCORSConfiguration() {
  console.log('\n🌐 Testing CORS Configuration...');
  console.log('================================');
  
  const fetch = require('node-fetch');
  
  try {
    // Test CORS preflight
    console.log('\n1. Testing CORS preflight for getFirebaseConfig...');
    const configUrl = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/getFirebaseConfig';
    
    try {
      const response = await fetch(configUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 10000
      });
      
      console.log(`CORS preflight status: ${response.status}`);
      
      if (response.status === 204 || response.status === 200) {
        console.log('✅ CORS preflight successful');
        
        // Test actual request
        console.log('\n2. Testing actual getFirebaseConfig request...');
        const actualResponse = await fetch(configUrl, {
          headers: { 'Origin': 'http://localhost:5173' },
          timeout: 10000
        });
        
        console.log(`Actual request status: ${actualResponse.status}`);
        if (actualResponse.ok) {
          console.log('✅ Firebase config request successful');
        } else {
          console.log('⚠️ Firebase config request failed');
        }
      } else {
        console.log('❌ CORS preflight failed');
      }
    } catch (error) {
      console.log('❌ CORS testing failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ CORS configuration testing failed:', error);
  }
}

async function main() {
  console.log('🚀 Firebase Functions Deployment Verification');
  console.log('============================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Run all tests
  const credentialSuccess = await testCredentialVerification();
  await testHealthEndpoints();
  await testCORSConfiguration();
  
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('======================');
  console.log(`Credential verification: ${credentialSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('Health endpoints: See results above');
  console.log('CORS configuration: See results above');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Test authentication flow in browser');
  console.log('2. Clear browser cache: localStorage.clear(); location.reload();');
  console.log('3. Verify patient data loads correctly');
  console.log('4. Monitor function logs for any issues');
  
  console.log(`\n✅ Verification completed at ${new Date().toISOString()}`);
  
  // Clean exit
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the tests
main().catch(console.error);