// Test tebraProxy with proper Firebase Authentication
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAJAj8WXD6qteQmMimwuQMj8FprOhYPppM",
  authDomain: "luknerlumina-firebase.firebaseapp.com",
  projectId: "luknerlumina-firebase",
  storageBucket: "luknerlumina-firebase.firebasestorage.app",
  messagingSenderId: "623450773640",
  appId: "1:623450773640:web:9afd63d3ccbb1fcb6fe73d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

async function testTebraProxyAuthenticated() {
  try {
    console.log('🔐 Authenticating with Firebase...');
    
    // Sign in anonymously to get auth token
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Authenticated as:', userCredential.user.uid);
    
    console.log('🧪 Testing tebraProxy callable function...');
    
    // Get the callable function
    const tebraProxy = httpsCallable(functions, 'tebraProxy');
    
    // Test 1: Health check
    console.log('\n📋 Test 1: Health Check');
    const healthResult = await tebraProxy({ action: 'health_check' });
    console.log('✅ Health Check Response:', JSON.stringify(healthResult.data, null, 2));
    
    // Test 2: Test connection
    console.log('\n📋 Test 2: Test Connection');
    const connResult = await tebraProxy({ action: 'testConnection' });
    console.log('✅ Connection Test Response:', JSON.stringify(connResult.data, null, 2));
    
    // Test 3: Get providers
    console.log('\n📋 Test 3: Get Providers');
    const providersResult = await tebraProxy({ action: 'getProviders' });
    console.log('✅ Providers Response:', JSON.stringify(providersResult.data, null, 2));
    
    console.log('\n🎉 ALL TESTS PASSED - tebraProxy is working with authentication!');
    
  } catch (error) {
    console.error('❌ tebraProxy test FAILED:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    if (error.code === 'functions/unauthenticated') {
      console.error('🚨 AUTHENTICATION FAILED - Function requires valid auth token');
    }
  }
}

// Run the test
testTebraProxyAuthenticated();