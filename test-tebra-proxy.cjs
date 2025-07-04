const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase config
const firebaseConfig = {
  projectId: "luknerlumina-firebase",
  storageBucket: "luknerlumina-firebase.firebasestorage.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function testTebraProxy() {
  try {
    console.log('🧪 Testing tebraProxy callable function...');
    
    // Get the callable function
    const tebraProxy = httpsCallable(functions, 'tebraProxy');
    
    // Test with a simple health check action
    const result = await tebraProxy({ action: 'health_check' });
    
    console.log('✅ tebraProxy function responded successfully!');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
  } catch (error) {
    console.log('❌ tebraProxy function test failed:');
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

testTebraProxy();