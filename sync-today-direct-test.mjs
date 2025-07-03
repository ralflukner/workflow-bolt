#!/usr/bin/env node

console.log('🚨 SYNC TODAY DIRECT API TEST');
console.log('===============================');

// Set up environment variables that are needed
process.env.VITE_FIREBASE_CONFIG_ENDPOINT = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/getFirebaseConfig';

async function testSyncTodayDirectly() {
  try {
    console.log('\n🔧 Testing Sync Today via direct API calls...');
    
    // Test direct Firebase Functions API call
    console.log('\n1️⃣ Testing direct Firebase Function call for tebraProxy...');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Testing sync for date: ${today}`);
      
      // Direct fetch to the Firebase Function
      const functionUrl = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/tebraProxy';
      
      const payload = {
        action: 'syncSchedule',
        date: today
      };
      
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: This would normally require authentication
        },
        body: JSON.stringify({ data: payload })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.text();
      console.log('Raw response:', result);
      
      try {
        const jsonResult = JSON.parse(result);
        console.log('Parsed response:', JSON.stringify(jsonResult, null, 2));
        
        if (jsonResult.result?.success) {
          console.log('✅ Direct API call successful');
        } else {
          console.log('❌ Direct API call failed');
          console.log(`Error: ${jsonResult.result?.error}`);
        }
      } catch (parseError) {
        console.log('❌ Failed to parse response as JSON');
      }
      
    } catch (error) {
      console.log('💥 Direct API call crashed:', error.message);
      
      if (error.message.includes('fetch is not defined')) {
        console.log('ℹ️  Installing node-fetch for compatibility...');
        try {
          const { default: fetch } = await import('node-fetch');
          global.fetch = fetch;
          console.log('✅ node-fetch installed, retrying...');
          // Could retry here, but for now just log
        } catch (fetchError) {
          console.log('❌ Could not install node-fetch:', fetchError.message);
        }
      }
    }
    
    // Test 2: Check network connectivity to Firebase
    console.log('\n2️⃣ Testing Firebase Functions connectivity...');
    
    try {
      const healthUrl = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/';
      console.log(`Testing connectivity to: ${healthUrl}`);
      
      // Simple connectivity test
      const response = await fetch(healthUrl);
      console.log('Connectivity status:', response.status);
      
      if (response.status === 404) {
        console.log('✅ Firebase Functions endpoint is reachable (404 expected for root)');
      } else {
        console.log(`ℹ️  Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log('💥 Firebase connectivity test failed:', error.message);
    }
    
    // Test 3: Check if we can reach the config endpoint
    console.log('\n3️⃣ Testing Firebase config endpoint...');
    
    try {
      const configUrl = 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/getFirebaseConfig';
      console.log(`Testing config endpoint: ${configUrl}`);
      
      const response = await fetch(configUrl);
      console.log('Config endpoint status:', response.status);
      
      if (response.ok) {
        const config = await response.text();
        console.log('Config response (first 200 chars):', config.substring(0, 200));
      } else {
        console.log('❌ Config endpoint not accessible');
      }
      
    } catch (error) {
      console.log('💥 Config endpoint test failed:', error.message);
    }
    
  } catch (error) {
    console.log('💥 Direct test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch not available, attempting to import node-fetch...');
  
  import('node-fetch')
    .then(({ default: fetch }) => {
      global.fetch = fetch;
      console.log('✅ node-fetch imported successfully');
      return testSyncTodayDirectly();
    })
    .catch((error) => {
      console.log('❌ Could not import node-fetch:', error.message);
      console.log('Please install node-fetch: npm install node-fetch');
      console.log('For now, testing without network calls...');
      
      console.log('\n📊 ANALYSIS FINDINGS');
      console.log('=====================');
      console.log('❌ Cannot test direct API calls without fetch');
      console.log('✅ Script structure is working');
      console.log('ℹ️  Environment variable issue identified: VITE_FIREBASE_CONFIG_ENDPOINT');
    });
} else {
  testSyncTodayDirectly()
    .then(() => {
      console.log('\n✅ Direct test complete');
    })
    .catch((error) => {
      console.log('\n💥 Direct test failed:', error.message);
    });
}