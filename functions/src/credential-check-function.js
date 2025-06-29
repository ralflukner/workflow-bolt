/**
 * Firebase Function for Credential Verification
 * 
 * This function provides an endpoint to verify all credentials and permissions
 * are correctly configured for Firebase Functions.
 */

const { onRequest, onCall } = require('firebase-functions/v2/https');
const { runCredentialVerification } = require('./utils/credential-verification');
const { logMetric, logError } = require('./monitoring/health-metrics');

/**
 * HTTP endpoint for credential verification (for external monitoring)
 */
exports.verifyCredentials = onRequest(
  {
    maxInstances: 5,
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
  },
  async (request, response) => {
    const startTime = Date.now();
    const functionName = 'verifyCredentials';
    
    try {
      console.log('🔍 Starting credential verification via HTTP endpoint...');
      
      // Run comprehensive credential verification
      const verificationResult = await runCredentialVerification();
      
      // Log metrics
      logMetric({
        function: functionName,
        operation: 'credential_check',
        duration: Date.now() - startTime,
        status: verificationResult.isValid ? 'success' : 'error',
        metadata: {
          checksTotal: verificationResult.summary.totalChecks,
          checksPassed: verificationResult.summary.passed,
          checksFailed: verificationResult.summary.failed,
          warningsCount: verificationResult.summary.warnings
        }
      });

      // Return appropriate HTTP status
      const statusCode = verificationResult.isValid ? 200 : 500;
      
      response.status(statusCode).json({
        success: verificationResult.isValid,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        summary: verificationResult.summary,
        checks: verificationResult.checks,
        errors: verificationResult.errors,
        warnings: verificationResult.warnings,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          functionName: process.env.FUNCTION_NAME || process.env.K_SERVICE,
          region: process.env.FUNCTION_REGION || process.env.GOOGLE_CLOUD_REGION,
          projectId: verificationResult.details?.firebase?.projectId
        }
      });

    } catch (error) {
      console.error('❌ Credential verification endpoint error:', error);
      
      logError(functionName, 'credential_check', error, {
        requestId: request.get('X-Cloud-Trace-Context'),
        userAgent: request.get('User-Agent')
      });
      
      response.status(500).json({
        success: false,
        error: 'Credential verification failed',
        message: error.message,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      });
    }
  }
);

/**
 * Callable function for credential verification (for authenticated app use)
 */
exports.checkCredentials = onCall(
  {
    maxInstances: 5,
    timeoutSeconds: 30,
    memory: '256MiB'
  },
  async (request) => {
    const startTime = Date.now();
    const functionName = 'checkCredentials';
    
    try {
      console.log('🔍 Starting credential verification via callable function...');
      
      // Optional: Add authentication check
      const isAuthenticated = request.auth?.uid;
      if (!isAuthenticated && process.env.NODE_ENV === 'production') {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Authentication required for credential check'
        );
      }

      // Run comprehensive credential verification
      const verificationResult = await runCredentialVerification();
      
      // Log metrics with user context
      logMetric({
        function: functionName,
        operation: 'credential_check',
        duration: Date.now() - startTime,
        status: verificationResult.isValid ? 'success' : 'error',
        metadata: {
          userId: request.auth?.uid || 'anonymous',
          checksTotal: verificationResult.summary.totalChecks,
          checksPassed: verificationResult.summary.passed,
          checksFailed: verificationResult.summary.failed,
          warningsCount: verificationResult.summary.warnings
        }
      });

      return {
        success: verificationResult.isValid,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        summary: verificationResult.summary,
        // Only include detailed info in development or for authenticated users
        details: (process.env.NODE_ENV === 'development' || isAuthenticated) ? {
          checks: verificationResult.checks,
          errors: verificationResult.errors,
          warnings: verificationResult.warnings,
          environment: verificationResult.details
        } : undefined
      };

    } catch (error) {
      console.error('❌ Credential verification callable error:', error);
      
      logError(functionName, 'credential_check', error, {
        userId: request.auth?.uid || 'anonymous',
        requestId: request.rawRequest?.get?.('X-Cloud-Trace-Context')
      });
      
      // Return appropriate error for callable functions
      if (error.code && error.message) {
        throw error; // Re-throw HttpsError
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Credential verification failed',
        error.message
      );
    }
  }
);

/**
 * Quick health check function for monitoring systems
 */
exports.healthCheck = onRequest(
  {
    maxInstances: 10,
    timeoutSeconds: 10,
    memory: '128MiB',
    cors: true
  },
  async (request, response) => {
    const startTime = Date.now();
    
    try {
      // Quick basic checks only
      const admin = require('firebase-admin');
      const hasFirebase = admin.apps.length > 0;
      const projectId = hasFirebase ? admin.apps[0].options.projectId : 'unknown';
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        firebase: hasFirebase,
        projectId: hasFirebase ? projectId : undefined,
        environment: {
          nodeVersion: process.version,
          functionName: process.env.FUNCTION_NAME || process.env.K_SERVICE,
          region: process.env.FUNCTION_REGION || process.env.GOOGLE_CLOUD_REGION
        }
      };
      
      response.status(200).json(health);
      
    } catch (error) {
      console.error('❌ Health check error:', error);
      
      response.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        error: error.message
      });
    }
  }
);