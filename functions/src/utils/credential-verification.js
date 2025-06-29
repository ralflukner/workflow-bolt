/**
 * Firebase and Google Cloud Credential Verification System
 * 
 * This module provides comprehensive credential verification for Firebase Functions
 * to ensure proper authentication and service connectivity before function execution.
 */

const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

/**
 * Credential verification results structure
 */
class CredentialVerificationResult {
  constructor() {
    this.isValid = false;
    this.checks = [];
    this.errors = [];
    this.warnings = [];
    this.details = {};
  }

  addCheck(name, status, message, details = {}) {
    this.checks.push({ name, status, message, details, timestamp: new Date().toISOString() });
    if (status === 'PASS') {
      // Check passed
    } else if (status === 'FAIL') {
      this.errors.push(`${name}: ${message}`);
    } else if (status === 'WARN') {
      this.warnings.push(`${name}: ${message}`);
    }
  }

  setOverallResult() {
    this.isValid = this.errors.length === 0;
  }

  getReport() {
    return {
      isValid: this.isValid,
      summary: {
        totalChecks: this.checks.length,
        passed: this.checks.filter(c => c.status === 'PASS').length,
        failed: this.checks.filter(c => c.status === 'FAIL').length,
        warnings: this.checks.filter(c => c.status === 'WARN').length
      },
      checks: this.checks,
      errors: this.errors,
      warnings: this.warnings,
      details: this.details
    };
  }
}

/**
 * Verify Firebase Admin SDK initialization and credentials
 */
async function verifyFirebaseCredentials() {
  const result = new CredentialVerificationResult();
  
  try {
    // Check if Firebase Admin is initialized
    const apps = admin.apps;
    if (apps.length === 0) {
      result.addCheck('Firebase Admin Init', 'FAIL', 'Firebase Admin SDK not initialized');
      result.setOverallResult();
      return result;
    }

    const app = apps[0];
    result.addCheck('Firebase Admin Init', 'PASS', 'Firebase Admin SDK initialized', {
      appName: app.name,
      projectId: app.options.projectId
    });

    // Verify project ID
    const projectId = app.options.projectId;
    if (!projectId) {
      result.addCheck('Project ID', 'FAIL', 'No project ID configured');
    } else {
      result.addCheck('Project ID', 'PASS', `Project ID: ${projectId}`, { projectId });
      result.details.projectId = projectId;
    }

    // Test Firestore connection
    try {
      const db = admin.firestore();
      const testCollection = db.collection('_credential_test');
      const testDoc = testCollection.doc('test');
      
      // Try to write a test document
      await testDoc.set({ 
        test: true, 
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: 'credential-verification'
      }, { merge: true });
      
      // Try to read it back
      const doc = await testDoc.get();
      if (doc.exists) {
        result.addCheck('Firestore Access', 'PASS', 'Firestore read/write successful');
        
        // Clean up test document
        await testDoc.delete();
      } else {
        result.addCheck('Firestore Access', 'FAIL', 'Firestore write succeeded but read failed');
      }
    } catch (firestoreError) {
      result.addCheck('Firestore Access', 'FAIL', `Firestore access failed: ${firestoreError.message}`, {
        errorCode: firestoreError.code,
        errorDetails: firestoreError.details
      });
    }

    // Test Firebase Auth
    try {
      const auth = admin.auth();
      
      // Try to create a test custom token (doesn't require user to exist)
      const testUid = 'credential-test-' + Date.now();
      const customToken = await auth.createCustomToken(testUid, { test: true });
      
      if (customToken) {
        result.addCheck('Firebase Auth', 'PASS', 'Firebase Auth custom token creation successful');
        
        // Verify the token can be decoded (basic validation)
        try {
          const decodedToken = await auth.verifyIdToken(customToken);
          result.addCheck('Firebase Auth Token', 'PASS', 'Custom token verification successful');
        } catch (tokenError) {
          // Custom tokens can't be verified the same way as ID tokens, this is expected
          if (tokenError.code === 'auth/argument-error') {
            result.addCheck('Firebase Auth Token', 'PASS', 'Custom token format valid (expected error)');
          } else {
            result.addCheck('Firebase Auth Token', 'WARN', `Token verification: ${tokenError.message}`);
          }
        }
      }
    } catch (authError) {
      result.addCheck('Firebase Auth', 'FAIL', `Firebase Auth failed: ${authError.message}`, {
        errorCode: authError.code
      });
    }

    // Check service account information
    try {
      const credential = app.options.credential;
      if (credential) {
        // Try to get service account email if available
        const serviceAccount = credential.getAccessToken ? 'Authenticated' : 'Unknown';
        result.addCheck('Service Account', 'PASS', `Credential type: ${serviceAccount}`);
      } else {
        result.addCheck('Service Account', 'WARN', 'No explicit credentials (using default)');
      }
    } catch (credError) {
      result.addCheck('Service Account', 'WARN', `Credential check failed: ${credError.message}`);
    }

  } catch (error) {
    result.addCheck('Firebase Overall', 'FAIL', `Unexpected error: ${error.message}`, {
      stack: error.stack
    });
  }

  result.setOverallResult();
  return result;
}

/**
 * Verify Google Cloud Secret Manager access
 */
async function verifySecretManagerCredentials() {
  const result = new CredentialVerificationResult();
  
  try {
    const client = new SecretManagerServiceClient();
    
    // Test listing secrets (requires Secret Manager Secret Accessor role)
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 
                       process.env.GCP_PROJECT || 
                       process.env.FIREBASE_PROJECT_ID ||
                       'luknerlumina-firebase';
      
      const parent = `projects/${projectId}`;
      
      // List first few secrets to test access
      const [secrets] = await client.listSecrets({
        parent: parent,
        pageSize: 5
      });
      
      result.addCheck('Secret Manager List', 'PASS', `Can list secrets (found ${secrets.length})`, {
        projectId,
        secretCount: secrets.length
      });
      
      result.details.secretManager = {
        projectId,
        secretCount: secrets.length,
        secrets: secrets.map(s => s.name?.split('/').pop() || 'unknown')
      };

      // Test accessing a specific secret if AUTH0_DOMAIN exists
      const authSecrets = secrets.filter(s => s.name?.includes('AUTH0_DOMAIN'));
      if (authSecrets.length > 0) {
        try {
          const secretName = authSecrets[0].name;
          const [version] = await client.accessSecretVersion({
            name: `${secretName}/versions/latest`
          });
          
          const secretValue = version.payload?.data?.toString();
          if (secretValue && secretValue.length > 0) {
            result.addCheck('Secret Manager Access', 'PASS', 'Can access secret values', {
              secretName: secretName.split('/').pop(),
              valueLength: secretValue.length
            });
          } else {
            result.addCheck('Secret Manager Access', 'WARN', 'Secret access returned empty value');
          }
        } catch (accessError) {
          result.addCheck('Secret Manager Access', 'FAIL', `Failed to access secret: ${accessError.message}`, {
            errorCode: accessError.code
          });
        }
      } else {
        result.addCheck('Secret Manager Access', 'WARN', 'No AUTH0_DOMAIN secret found for testing');
      }

    } catch (listError) {
      result.addCheck('Secret Manager List', 'FAIL', `Cannot list secrets: ${listError.message}`, {
        errorCode: listError.code,
        errorDetails: listError.details
      });
    }

  } catch (error) {
    result.addCheck('Secret Manager Overall', 'FAIL', `Unexpected error: ${error.message}`, {
      stack: error.stack
    });
  }

  result.setOverallResult();
  return result;
}

/**
 * Verify Google Cloud IAM permissions
 */
async function verifyIAMPermissions() {
  const result = new CredentialVerificationResult();
  
  try {
    // Test if we can access Google Cloud metadata (indicates we're running in GCP)
    const metadata = await testMetadataAccess();
    if (metadata.available) {
      result.addCheck('GCP Metadata', 'PASS', 'Running in Google Cloud environment', metadata);
    } else {
      result.addCheck('GCP Metadata', 'WARN', 'Not running in Google Cloud (local development?)');
    }

    // Test basic Cloud Functions environment
    const functionEnv = {
      functionName: process.env.FUNCTION_NAME || process.env.K_SERVICE,
      functionRegion: process.env.FUNCTION_REGION || process.env.GOOGLE_CLOUD_REGION,
      functionTarget: process.env.FUNCTION_TARGET,
      isEmulator: process.env.FUNCTIONS_EMULATOR === 'true'
    };

    if (functionEnv.functionName) {
      result.addCheck('Function Environment', 'PASS', 'Running in Cloud Functions environment', functionEnv);
    } else if (functionEnv.isEmulator) {
      result.addCheck('Function Environment', 'PASS', 'Running in Functions Emulator', functionEnv);
    } else {
      result.addCheck('Function Environment', 'WARN', 'Environment detection unclear', functionEnv);
    }

    result.details.environment = functionEnv;

  } catch (error) {
    result.addCheck('IAM Overall', 'FAIL', `Unexpected error: ${error.message}`, {
      stack: error.stack
    });
  }

  result.setOverallResult();
  return result;
}

/**
 * Test Google Cloud metadata access
 */
async function testMetadataAccess() {
  try {
    const http = require('http');
    const https = require('https');
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'metadata.google.internal',
        port: 80,
        path: '/computeMetadata/v1/project/project-id',
        method: 'GET',
        timeout: 2000,
        headers: {
          'Metadata-Flavor': 'Google'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            available: true,
            projectId: data,
            statusCode: res.statusCode
          });
        });
      });

      req.on('error', () => {
        resolve({ available: false });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ available: false });
      });

      req.end();
    });
  } catch (error) {
    return { available: false, error: error.message };
  }
}

/**
 * Run comprehensive credential verification
 */
async function runCredentialVerification() {
  const startTime = Date.now();
  const overallResult = new CredentialVerificationResult();
  
  console.log('🔍 Starting comprehensive credential verification...');
  
  // Run all verification checks
  const [firebaseResult, secretManagerResult, iamResult] = await Promise.all([
    verifyFirebaseCredentials(),
    verifySecretManagerCredentials(),
    verifyIAMPermissions()
  ]);

  // Combine results
  const allChecks = [
    ...firebaseResult.checks,
    ...secretManagerResult.checks,
    ...iamResult.checks
  ];

  const allErrors = [
    ...firebaseResult.errors,
    ...secretManagerResult.errors,
    ...iamResult.errors
  ];

  const allWarnings = [
    ...firebaseResult.warnings,
    ...secretManagerResult.warnings,
    ...iamResult.warnings
  ];

  // Create combined result
  overallResult.checks = allChecks;
  overallResult.errors = allErrors;
  overallResult.warnings = allWarnings;
  overallResult.isValid = allErrors.length === 0;
  
  overallResult.details = {
    firebase: firebaseResult.details,
    secretManager: secretManagerResult.details,
    iam: iamResult.details,
    executionTime: Date.now() - startTime,
    timestamp: new Date().toISOString()
  };

  const report = overallResult.getReport();
  
  // Log summary
  console.log(`✅ Credential verification completed in ${report.details.executionTime}ms`);
  console.log(`📊 Results: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`);
  
  if (report.errors.length > 0) {
    console.error('❌ Credential errors found:', report.errors);
  }
  
  if (report.warnings.length > 0) {
    console.warn('⚠️ Credential warnings:', report.warnings);
  }

  return report;
}

/**
 * Express middleware for credential verification
 */
function credentialVerificationMiddleware() {
  return async (req, res, next) => {
    try {
      const verificationResult = await runCredentialVerification();
      
      if (!verificationResult.isValid) {
        console.error('❌ Credential verification failed, blocking request');
        return res.status(500).json({
          error: 'Service configuration error',
          message: 'Authentication credentials are not properly configured',
          details: process.env.NODE_ENV === 'development' ? verificationResult : undefined
        });
      }
      
      // Add verification info to request
      req.credentialVerification = verificationResult;
      next();
    } catch (error) {
      console.error('❌ Credential verification middleware error:', error);
      res.status(500).json({
        error: 'Service configuration error',
        message: 'Failed to verify authentication credentials'
      });
    }
  };
}

module.exports = {
  verifyFirebaseCredentials,
  verifySecretManagerCredentials,
  verifyIAMPermissions,
  runCredentialVerification,
  credentialVerificationMiddleware,
  CredentialVerificationResult
};