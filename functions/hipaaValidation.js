const { onCall } = require('firebase-functions/v2/https');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

/**
 * HIPAA-compliant Secret Manager validation
 * This runs on the backend (Firebase Functions) where Node.js modules are available
 */
exports.validateHIPAACompliance = onCall({ cors: true }, async (request) => {
  console.log('Validating HIPAA compliance...');
  
  try {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
    
    if (!projectId) {
      return {
        success: false,
        isCompliant: false,
        issues: ['Google Cloud Project ID not configured'],
        recommendations: ['Set GOOGLE_CLOUD_PROJECT environment variable']
      };
    }

    const requiredSecrets = ['TEBRA_USERNAME', 'TEBRA_PASSWORD', 'TEBRA_API_URL'];
    const missingSecrets = [];
    const availableSecrets = [];

    // Check each required secret
    for (const secretName of requiredSecrets) {
      try {
        const secretPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;
        await client.accessSecretVersion({ name: secretPath });
        availableSecrets.push(secretName);
        console.log(`✅ Secret ${secretName} is available`);
      } catch (error) {
        missingSecrets.push(secretName);
        console.warn(`❌ Secret ${secretName} is missing:`, error.message);
      }
    }

    const isCompliant = missingSecrets.length === 0;
    const issues = [];
    const recommendations = [];

    if (!isCompliant) {
      issues.push(`Missing required secrets: ${missingSecrets.join(', ')}`);
      recommendations.push('Configure all required secrets in Google Secret Manager');
    }

    // Additional HIPAA compliance checks
    if (process.env.NODE_ENV === 'production') {
      // Check if we're using HTTPS
      const protocol = request.rawRequest?.protocol || 'https';
      if (protocol !== 'https') {
        issues.push('Non-HTTPS communication detected');
        recommendations.push('Ensure all communications use HTTPS');
      }
    }

    return {
      success: true,
      isCompliant,
      issues,
      recommendations,
      availableSecrets: availableSecrets.length,
      totalSecrets: requiredSecrets.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('HIPAA validation failed:', error);
    return {
      success: false,
      isCompliant: false,
      issues: [`Validation error: ${error.message}`],
      recommendations: [
        'Check Google Cloud Secret Manager API is enabled',
        'Verify service account permissions',
        'Ensure Firebase Functions have access to Secret Manager'
      ]
    };
  }
});

/**
 * Utility function to redact sensitive information from log messages
 * This is a backend-safe version of the redaction utility
 */
function redactSensitiveData(message, sensitiveValues = []) {
  let redactedMessage = message;
  
  for (const value of sensitiveValues) {
    if (value && typeof value === 'string' && value.length > 0) {
      // Escape special regex characters
      const escapedValue = value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedValue, 'gi');
      redactedMessage = redactedMessage.replace(regex, '[REDACTED]');
    }
  }
  
  return redactedMessage;
}

/**
 * Test function to validate secret redaction works properly
 */
exports.testSecretRedaction = onCall({ cors: true }, async (request) => {
  const { message, testSecrets } = request.data;
  
  try {
    const redactedMessage = redactSensitiveData(message, testSecrets);
    
    return {
      success: true,
      originalMessage: '[REDACTED FOR SECURITY]', // Never return the original
      redactedMessage,
      containsSensitiveData: testSecrets.some(secret => message.includes(secret)),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Secret redaction test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

module.exports = { redactSensitiveData }; 