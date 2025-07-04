// Browser console test for tebraProxy with authentication
// Run this in the browser console after logging into the application

window.testTebraProxyWithAuth = async function() {
  console.log('🧪 Testing tebraProxy with proper authentication...');
  
  try {
    // Import the Firebase modules from the application
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    
    // Get the Firebase app instance that's already configured
    const functions = getFunctions();
    
    // Get the tebraProxy callable function
    const tebraProxy = httpsCallable(functions, 'tebraProxy');
    
    console.log('🔐 Using existing authentication from logged-in user...');
    
    // Test 1: Health check
    console.log('\n📋 Test 1: Health Check');
    try {
      const healthResult = await tebraProxy({ action: 'health_check' });
      console.log('✅ Health Check SUCCESS:', healthResult.data);
    } catch (e) {
      console.error('❌ Health Check FAILED:', e.message);
    }
    
    // Test 2: Test connection
    console.log('\n📋 Test 2: Test Connection');
    try {
      const connResult = await tebraProxy({ action: 'testConnection' });
      console.log('✅ Connection Test SUCCESS:', connResult.data);
    } catch (e) {
      console.error('❌ Connection Test FAILED:', e.message);
    }
    
    // Test 3: Get providers
    console.log('\n📋 Test 3: Get Providers');
    try {
      const providersResult = await tebraProxy({ action: 'getProviders' });
      console.log('✅ Providers Test SUCCESS:', providersResult.data);
    } catch (e) {
      console.error('❌ Providers Test FAILED:', e.message);
    }
    
    // Test 4: Cloud Run health check with rate limiting
    console.log('\n📋 Test 4: Cloud Run Health Check (with Firestore rate limiting)');
    try {
      const healthResult = await tebraProxy({ action: 'cloudRunHealth' });
      console.log('✅ Cloud Run Health SUCCESS:', {
        status: healthResult.data?.status,
        httpStatus: healthResult.data?.httpStatus,
        duration: healthResult.duration || 'unknown',
        cached: healthResult.cached || false,
        serviceEndpoint: healthResult.data?.serviceEndpoint
      });
    } catch (e) {
      console.error('❌ Cloud Run Health FAILED:', e.message);
    }
    
    console.log('\n🎉 tebraProxy testing complete!');
    
  } catch (error) {
    console.error('❌ Test setup FAILED:', error);
  }
};

console.log('✅ Test function loaded. After logging in, run: testTebraProxyWithAuth()');