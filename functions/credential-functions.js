/**
 * Firebase Functions for Credential Verification
 * 
 * Provides HTTP endpoints and callable functions to verify system credentials
 */

const { onRequest, onCall, onSchedule } = require('firebase-functions/v2/https');
const { onSchedule: onScheduleV2 } = require('firebase-functions/v2/scheduler');
const { runCredentialVerification } = require('./utils/credential-verification');

/**
 * HTTP endpoint for credential verification
 * GET https://us-central1-PROJECT.cloudfunctions.net/verifyCredentials
 */
const verifyCredentials = onRequest({
  maxInstances: 5,
  timeoutSeconds: 30,
  cors: true
}, async (request, response) => {
  try {
    console.log('🔍 HTTP credential verification request received');
    
    const verificationResult = await runCredentialVerification();
    const summary = verificationResult.getSummary();
    
    const statusCode = verificationResult.isValid ? 200 : 500;
    
    response.status(statusCode).json({
      valid: verificationResult.isValid,
      summary,
      checks: verificationResult.checks,
      errors: verificationResult.errors,
      warnings: verificationResult.warnings,
      timestamp: verificationResult.timestamp
    });
    
    console.log(`✅ HTTP credential verification completed: ${summary.overall}`);
    
  } catch (error) {
    console.error('❌ HTTP credential verification failed:', error);
    response.status(500).json({
      valid: false,
      error: 'Credential verification failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Callable function for credential verification (for authenticated clients)
 * Use with: httpsCallable(functions, 'checkCredentials')
 */
const checkCredentials = onCall({
  maxInstances: 5,
  timeoutSeconds: 30
}, async (request) => {
  try {
    console.log('🔍 Callable credential verification request received');
    
    const verificationResult = await runCredentialVerification();
    const summary = verificationResult.getSummary();
    
    console.log(`✅ Callable credential verification completed: ${summary.overall}`);
    
    return {
      valid: verificationResult.isValid,
      summary,
      checks: verificationResult.checks,
      errors: verificationResult.errors,
      warnings: verificationResult.warnings,
      timestamp: verificationResult.timestamp
    };
    
  } catch (error) {
    console.error('❌ Callable credential verification failed:', error);
    throw new Error(`Credential verification failed: ${error.message}`);
  }
});

/**
 * Simple health check endpoint
 * GET https://us-central1-PROJECT.cloudfunctions.net/healthCheck
 */
const healthCheck = onRequest({
  maxInstances: 10,
  timeoutSeconds: 10,
  cors: true
}, async (request, response) => {
  try {
    // Set explicit CORS headers
    const origin = request.headers.origin;
    if (origin && (origin.includes('localhost') || origin.startsWith('file://') || origin.includes('luknerlumina-firebase'))) {
      response.set('Access-Control-Allow-Origin', origin);
    } else {
      response.set('Access-Control-Allow-Origin', '*');
    }
    
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    response.set('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      console.log('✅ Health check CORS preflight handled');
      response.status(204).send('');
      return;
    }
    
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    response.status(200).json({
      status: 'healthy',
      timestamp,
      uptime: `${Math.floor(uptime)} seconds`,
      environment: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      function: 'healthCheck'
    });
    
    console.log('✅ Health check completed successfully');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    response.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Scheduled credential verification (runs every hour)
 * Automatically checks credentials and logs results
 */
const scheduledCredentialCheck = onScheduleV2({
  schedule: '0 * * * *', // Every hour
  timeZone: 'America/Chicago',
  maxInstances: 1
}, async (event) => {
  try {
    console.log('🕐 Scheduled credential verification starting...');
    
    const verificationResult = await runCredentialVerification();
    const summary = verificationResult.getSummary();
    
    if (verificationResult.isValid) {
      console.log(`✅ Scheduled verification passed: ${summary.passed}/${summary.total} checks`);
    } else {
      console.error(`❌ Scheduled verification failed: ${verificationResult.errors.length} errors`);
      console.error('Errors:', verificationResult.errors);
    }
    
    if (verificationResult.warnings.length > 0) {
      console.warn('⚠️ Warnings detected:', verificationResult.warnings);
    }
    
    // Log detailed results for monitoring
    console.log('📊 Verification Details:', JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('❌ Scheduled credential verification failed:', error);
  }
});

module.exports = {
  verifyCredentials,
  checkCredentials,
  healthCheck,
  scheduledCredentialCheck
};