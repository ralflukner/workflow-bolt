#!/usr/bin/env node

/**
 * Test script to demonstrate enhanced debugging logging
 * Run with: node test-debug-logging.js
 */

const { tebraProxyClient } = require('./functions/src/tebra-proxy-client');
const { DebugLogger } = require('./functions/src/debug-logger');

async function testEnhancedLogging() {
  const logger = new DebugLogger('TestScript');
  
  logger.info('Starting enhanced logging test');
  
  try {
    // Test 1: Connection test
    logger.info('=== Test 1: Connection Test ===');
    const connectionResult = await tebraProxyClient.testConnection();
    logger.info('Connection test result', { success: connectionResult });
    
    // Test 2: Get providers (should work)
    logger.info('=== Test 2: Get Providers ===');
    const providers = await tebraProxyClient.getProviders();
    logger.info('Providers retrieved', { 
      count: Array.isArray(providers) ? providers.length : 'not-array',
      hasData: !!providers 
    });
    
    // Test 3: Get appointments (might trigger InternalServiceFault)
    logger.info('=== Test 3: Get Appointments (Large Date Range) ===');
    const fromDate = '2024-01-01';
    const toDate = '2024-12-31'; // Large range to potentially trigger fault
    
    try {
      const appointments = await tebraProxyClient.getAppointments(fromDate, toDate);
      logger.info('Appointments retrieved successfully', {
        count: Array.isArray(appointments) ? appointments.length : 'not-array',
        dateRange: `${fromDate} to ${toDate}`
      });
    } catch (appointmentError) {
      logger.error('Appointment retrieval failed (expected for large ranges)', {
        error: appointmentError.message,
        isInternalServiceFault: appointmentError.message.includes('InternalServiceFault'),
        correlationId: appointmentError.correlationId,
        action: appointmentError.action
      });
    }
    
    // Test 4: Invalid request to test error handling
    logger.info('=== Test 4: Invalid Request (Error Testing) ===');
    try {
      await tebraProxyClient.makeRequest('invalidAction', { test: 'data' });
    } catch (invalidError) {
      logger.error('Invalid request failed as expected', {
        error: invalidError.message,
        correlationId: invalidError.correlationId
      });
    }
    
    logger.info('Enhanced logging test completed successfully');
    
  } catch (error) {
    logger.error('Test script failed', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Run the test
if (require.main === module) {
  console.log('🔍 Starting Enhanced Debugging Test...\n');
  testEnhancedLogging()
    .then(() => {
      console.log('\n✅ Test completed. Check the logs above for detailed debugging information.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEnhancedLogging }; 