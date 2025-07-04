// Test Firestore-based rate limiting for cloudRunHealth action
// Run this in the browser console after logging in

window.testFirestoreRateLimit = async function() {
  console.log('🧪 Testing Firestore-based rate limiting for cloudRunHealth...');
  
  try {
    // Import the tebraFirebaseApi module
    const { callTebraProxy } = await import('../src/services/tebraFirebaseApi.js');
    
    console.log('🔐 Testing with authenticated user...');
    
    // Test 1: Single health check request (should succeed)
    console.log('\n📋 Test 1: Single health check request');
    try {
      const startTime = Date.now();
      const result = await callTebraProxy('cloudRunHealth');
      const duration = Date.now() - startTime;
      
      console.log('✅ Health Check SUCCESS:', {
        success: result.success,
        status: result.data?.status,
        httpStatus: result.data?.httpStatus,
        duration: `${duration}ms`,
        cached: result.cached || false
      });
    } catch (e) {
      console.error('❌ Health Check FAILED:', e.message);
    }
    
    // Test 2: Multiple rapid requests to test rate limiting
    console.log('\n📋 Test 2: Rapid requests to test rate limiting (max 10/minute)');
    const promises = [];
    
    for (let i = 1; i <= 12; i++) {
      promises.push(
        callTebraProxy('cloudRunHealth', { forceRefresh: true })
          .then(result => ({
            request: i,
            success: true,
            status: result.data?.status,
            cached: result.cached || false
          }))
          .catch(error => ({
            request: i,
            success: false,
            error: error.message,
            isRateLimit: error.message.includes('Too many')
          }))
      );
    }
    
    const results = await Promise.all(promises);
    
    let successCount = 0;
    let rateLimitCount = 0;
    let otherErrors = 0;
    
    results.forEach(result => {
      if (result.success) {
        successCount++;
        console.log(`✅ Request ${result.request}: SUCCESS (cached: ${result.cached})`);
      } else if (result.isRateLimit) {
        rateLimitCount++;
        console.log(`⚠️ Request ${result.request}: RATE LIMITED`);
      } else {
        otherErrors++;
        console.error(`❌ Request ${result.request}: ERROR -`, result.error);
      }
    });
    
    console.log('\n📊 Rate Limiting Test Results:', {
      totalRequests: results.length,
      successful: successCount,
      rateLimited: rateLimitCount,
      otherErrors: otherErrors,
      rateLimitWorking: rateLimitCount > 0
    });
    
    // Test 3: Test cache behavior
    console.log('\n📋 Test 3: Cache behavior test');
    try {
      const uncachedResult = await callTebraProxy('cloudRunHealth', { forceRefresh: true });
      const cachedResult = await callTebraProxy('cloudRunHealth');
      
      console.log('✅ Cache Test Results:', {
        uncachedResponse: {
          cached: uncachedResult.cached || false,
          duration: uncachedResult.duration || 'unknown'
        },
        cachedResponse: {
          cached: cachedResult.cached || false,
          duration: cachedResult.duration || 'unknown',
          cacheAge: cachedResult.cacheAge || 'unknown'
        }
      });
    } catch (e) {
      console.error('❌ Cache Test FAILED:', e.message);
    }
    
    console.log('\n🎉 Firestore rate limiting tests complete!');
    console.log('💡 Check Firebase Console → Firestore → rateLimits collection for rate limit records');
    
  } catch (error) {
    console.error('❌ Test setup FAILED:', error);
  }
};

console.log('✅ Firestore rate limit test loaded. After logging in, run: testFirestoreRateLimit()');