#!/usr/bin/env node

/**
 * Firebase Functions Deployment Verification Script
 * 
 * This script tests that deployed Firebase Functions are responding correctly.
 * - 403 responses indicate functions are deployed and protected (GOOD)
 * - 404 responses indicate functions are not deployed (BAD)  
 * - 500+ responses indicate runtime errors (BAD)
 * 
 * Usage: node test-functions-deployment.cjs [project-id]
 */

const https = require('https');
const process = require('process');

// Configuration
const PROJECT_ID = process.argv[2] || 'luknerlumina-firebase';
const REGION = 'us-central1';
const TIMEOUT_MS = 10000;

// List of functions to test
const FUNCTIONS = [
  'exchangeAuth0Token',
  'getFirebaseConfig', 
  'tebraTestConnection',
  'generatePatientReport',
  'getAllPatients',
  'searchPatients',
  'createPatient',
  'updatePatient',
  'deletePatient',
  'getScheduledAppointments',
  'syncSchedule',
  'testTebra',
  'tebraRealTest'
];

// Test results tracking
const results = {
  total: 0,
  deployed: 0,
  failed: 0,
  errors: []
};

/**
 * Test a single Firebase Function
 */
async function testFunction(functionName) {
  const url = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${functionName}`;
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Firebase-Deployment-Test/1.0'
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      let status, message;
      
      if (statusCode === 403) {
        // Function is deployed and protected (expected for callable functions)
        status = '✅ DEPLOYED';
        message = 'Protected (expected)';
        results.deployed++;
      } else if (statusCode === 404) {
        // Function not found - deployment issue
        status = '❌ NOT FOUND';
        message = 'Function not deployed';
        results.failed++;
        results.errors.push(`${functionName}: Not deployed (404)`);
      } else if (statusCode >= 500) {
        // Server error - runtime issue
        status = '❌ ERROR';
        message = `Runtime error (${statusCode})`;
        results.failed++;
        results.errors.push(`${functionName}: Runtime error (${statusCode})`);
      } else if (statusCode === 401) {
        // Unauthorized but function exists
        status = '✅ DEPLOYED';
        message = 'Requires auth (expected)';
        results.deployed++;
      } else if (statusCode >= 200 && statusCode < 300) {
        // Success response
        status = '✅ DEPLOYED';
        message = `Success (${statusCode})`;
        results.deployed++;
      } else {
        // Other status codes
        status = '⚠️  UNKNOWN';
        message = `Unexpected status (${statusCode})`;
        results.failed++;
        results.errors.push(`${functionName}: Unexpected status ${statusCode}`);
      }
      
      console.log(`${functionName.padEnd(25)} ${status.padEnd(12)} ${statusCode} ${message} (${duration}ms)`);
      resolve({ functionName, statusCode, duration, success: statusCode === 403 || statusCode === 401 || (statusCode >= 200 && statusCode < 300) });
    });
    
    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`${functionName.padEnd(25)} ❌ NETWORK     ERR Network error: ${err.code} (${duration}ms)`);
      results.failed++;
      results.errors.push(`${functionName}: Network error - ${err.message}`);
      resolve({ functionName, statusCode: null, duration, success: false, error: err.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      console.log(`${functionName.padEnd(25)} ❌ TIMEOUT    TMO Request timeout (${duration}ms)`);
      results.failed++;
      results.errors.push(`${functionName}: Request timeout`);
      resolve({ functionName, statusCode: null, duration, success: false, error: 'timeout' });
    });
  });
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 Firebase Functions Deployment Verification');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Region:  ${REGION}`);
  console.log(`Testing ${FUNCTIONS.length} functions...\\n`);
  
  console.log('Function Name            Status       Code Message');
  console.log('-'.repeat(80));
  
  results.total = FUNCTIONS.length;
  
  // Test all functions sequentially to avoid overwhelming the endpoints
  for (const functionName of FUNCTIONS) {
    await testFunction(functionName);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Print summary
  console.log('\\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Functions:    ${results.total}`);
  console.log(`✅ Deployed:        ${results.deployed}`);
  console.log(`❌ Failed:          ${results.failed}`);
  console.log(`📈 Success Rate:    ${Math.round((results.deployed / results.total) * 100)}%`);
  
  if (results.errors.length > 0) {
    console.log('\\n🚨 ISSUES DETECTED:');
    results.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  console.log('\\n💡 LEGEND:');
  console.log('   ✅ DEPLOYED = Function responding (403/401/2xx expected)');
  console.log('   ❌ NOT FOUND = Function not deployed (404 - deployment issue)'); 
  console.log('   ❌ ERROR = Function runtime error (5xx - code issue)');
  console.log('   ❌ NETWORK = Network connectivity issue');
  console.log('   ❌ TIMEOUT = Function not responding within 10s');
  
  // Exit with appropriate code
  const exitCode = results.failed > 0 ? 1 : 0;
  console.log(`\\n${exitCode === 0 ? '✅' : '❌'} Verification ${exitCode === 0 ? 'PASSED' : 'FAILED'}`);
  
  if (exitCode === 0) {
    console.log('🎉 All functions are properly deployed and responding!');
  } else {
    console.log('⚠️  Some functions have deployment issues. Check the errors above.');
    console.log('💭 Next steps:');
    console.log('   1. Verify functions are deployed: firebase deploy --only functions');
    console.log('   2. Check function logs: firebase functions:log');
    console.log('   3. Test locally: firebase emulators:start --only functions');
  }
  
  process.exit(exitCode);
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Firebase Functions Deployment Verification Script');
  console.log('');
  console.log('Usage: node test-functions-deployment.cjs [project-id]');
  console.log('');
  console.log('Options:');
  console.log('  project-id    Firebase project ID (default: luknerlumina-firebase)');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node test-functions-deployment.cjs');
  console.log('  node test-functions-deployment.cjs my-project-id');
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});