#!/usr/bin/env node

/**
 * Integration Test Runner
 * Run this script to test Firebase and Tebra integration
 * 
 * Usage:
 *   node run-integration-test.js [test-type]
 * 
 * Test types:
 *   all      - Run all integration tests (default)
 *   firebase - Test Firebase operations only
 *   tebra    - Test Tebra operations only
 */

const { execSync } = require('child_process');
const path = require('path');

// Load environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  console.log('Note: .env.local not found, using environment variables from direnv');
}

const testType = process.argv[2] || 'all';

console.log('🚀 Integration Test Runner');
console.log('=========================\n');

// Check if environment variables are loaded
const requiredEnvVars = [
  'REACT_APP_TEBRA_USERNAME',
  'REACT_APP_TEBRA_PASSWORD',
  'REACT_APP_TEBRA_CUSTKEY',
  'REACT_APP_TEBRA_WSDL_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease ensure your .env.local file is set up or direnv is loaded.');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`📋 Test type: ${testType}\n`);

try {
  let command;
  
  switch (testType) {
    case 'firebase':
      command = `node -e "
        require('./src/utils/test-integration.ts').testFirebaseOperations()
          .then(() => console.log('\\n✅ Firebase test completed'))
          .catch(err => { console.error('❌ Test failed:', err); process.exit(1); });
      "`;
      break;
      
    case 'tebra':
      command = `node -e "
        require('./src/utils/test-integration.ts').testTebraOperations()
          .then(() => console.log('\\n✅ Tebra test completed'))
          .catch(err => { console.error('❌ Test failed:', err); process.exit(1); });
      "`;
      break;
      
    case 'all':
    default:
      command = `node -e "
        require('./src/utils/test-integration.ts').runIntegrationTests()
          .then(() => console.log('\\n🎉 All tests completed'))
          .catch(err => { console.error('❌ Test suite failed:', err); process.exit(1); });
      "`;
      break;
  }

  console.log('🏃 Running integration tests...\n');
  
  // Use ts-node to run TypeScript directly
  const tsCommand = command.replace('node -e', 'npx ts-node -e');
  
  execSync(tsCommand, { 
    stdio: 'inherit',
    env: { ...process.env }
  });

} catch (error) {
  console.error('\n💥 Integration test runner failed:', error.message);
  console.log('\nTroubleshooting tips:');
  console.log('1. Ensure your .env.local file has the correct Tebra credentials');
  console.log('2. Make sure Firebase is configured');
  console.log('3. Check that you have network connectivity');
  console.log('4. Verify that the Tebra EHR service is accessible');
  process.exit(1);
} 