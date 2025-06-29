// Test script to verify deployed Firebase Functions are working
const { initializeApp } = require('firebase-admin/app');
const { getFunctions } = require('firebase-admin/functions');
const { credential } = require('firebase-admin');

// Initialize Firebase Admin
const app = initializeApp({
  projectId: 'luknerlumina-firebase'
});

async function testDeployedFunctions() {
  console.log('🧪 Testing deployed Firebase Functions...\n');

  try {
    // Test 1: getFirebaseConfig function
    console.log('1️⃣ Testing getFirebaseConfig...');
    const getFirebaseConfigUrl = 'https://getfirebaseconfig-xccvzgogwa-uc.a.run.app';
    const configResponse = await fetch(getFirebaseConfigUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: {} })
    });
    
    console.log('   Status:', configResponse.status);
    if (configResponse.status === 200) {
      const configData = await configResponse.json();
      console.log('   ✅ getFirebaseConfig is responsive');
      console.log('   Response keys:', Object.keys(configData).join(', '));
    } else {
      console.log('   ⚠️  getFirebaseConfig returned status:', configResponse.status);
    }

  } catch (error) {
    console.error('   ❌ Error testing getFirebaseConfig:', error.message);
  }

  try {
    // Test 2: exchangeAuth0Token function (expect error due to missing token)
    console.log('\n2️⃣ Testing exchangeAuth0Token (expecting validation error)...');
    const authTokenUrl = 'https://exchangeauth0token-xccvzgogwa-uc.a.run.app';
    const authResponse = await fetch(authTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: {} })
    });
    
    console.log('   Status:', authResponse.status);
    const authData = await authResponse.json();
    
    if (authData.error && authData.error.message && authData.error.message.includes('auth0Token is required')) {
      console.log('   ✅ exchangeAuth0Token is working (correctly rejecting missing token)');
    } else {
      console.log('   ⚠️  Unexpected response from exchangeAuth0Token');
      console.log('   Response:', JSON.stringify(authData, null, 2));
    }

  } catch (error) {
    console.error('   ❌ Error testing exchangeAuth0Token:', error.message);
  }

  try {
    // Test 3: tebraTestConnection function  
    console.log('\n3️⃣ Testing tebraTestConnection...');
    const tebraTestUrl = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/tebraTestConnection';
    const tebraResponse = await fetch(tebraTestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: {} })
    });
    
    console.log('   Status:', tebraResponse.status);
    if (tebraResponse.status === 200) {
      const tebraData = await tebraResponse.json();
      console.log('   ✅ tebraTestConnection is responsive');
      console.log('   Response keys:', Object.keys(tebraData).join(', '));
    } else {
      console.log('   ⚠️  tebraTestConnection returned status:', tebraResponse.status);
    }

  } catch (error) {
    console.error('   ❌ Error testing tebraTestConnection:', error.message);
  }

  console.log('\n🏁 Function testing complete!');
}

// Run the tests
testDeployedFunctions().catch(console.error);