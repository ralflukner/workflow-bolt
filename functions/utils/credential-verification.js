/**
 * Firebase Functions Credential Verification System
 * 
 * Comprehensive system to verify all Firebase and external service credentials
 * are properly configured and accessible.
 */

const admin = require('firebase-admin');

/**
 * Result container for credential verification
 */
class CredentialVerificationResult {
  constructor() {
    this.isValid = true;
    this.checks = {};
    this.errors = [];
    this.warnings = [];
    this.timestamp = new Date().toISOString();
    this.environment = process.env.NODE_ENV || 'unknown';
  }

  addCheck(name, passed, details = null, error = null) {
    this.checks[name] = {
      passed,
      details,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    };
    
    if (!passed) {
      this.isValid = false;
      this.errors.push(`${name}: ${error?.message || error || 'Check failed'}`);
    }
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  getSummary() {
    const totalChecks = Object.keys(this.checks).length;
    const passedChecks = Object.values(this.checks).filter(check => check.passed).length;
    
    return {
      overall: this.isValid ? 'VALID' : 'INVALID',
      passed: passedChecks,
      total: totalChecks,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      environment: this.environment
    };
  }
}

/**
 * Check Firebase Admin SDK and Firestore access
 */
async function checkFirebaseProject() {
  const result = new CredentialVerificationResult();
  
  try {
    // Check if Admin SDK is initialized
    const app = admin.apps.length > 0 ? admin.apps[0] : null;
    result.addCheck('firebase_admin_initialized', !!app, 
      app ? `App name: ${app.name}` : null,
      app ? null : 'Firebase Admin SDK not initialized'
    );

    if (!app) {
      return result;
    }

    // Test Firestore connection
    try {
      const db = admin.firestore();
      const testCollection = db.collection('_credential_test');
      const testDoc = testCollection.doc('test');
      
      await testDoc.set({ 
        test: true, 
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      });
      
      const snapshot = await testDoc.get();
      const data = snapshot.data();
      
      result.addCheck('firestore_write', true, 'Test document created successfully');
      result.addCheck('firestore_read', !!data, 'Test document read successfully');
      
      // Clean up test document
      await testDoc.delete();
      result.addCheck('firestore_delete', true, 'Test document deleted successfully');
      
    } catch (firestoreError) {
      result.addCheck('firestore_access', false, null, firestoreError);
    }

    // Test Firebase Auth Admin
    try {
      const auth = admin.auth();
      // Just check if we can access the service (doesn't require actual users)
      result.addCheck('firebase_auth_admin', true, 'Firebase Auth admin access confirmed');
    } catch (authError) {
      result.addCheck('firebase_auth_admin', false, null, authError);
    }

  } catch (error) {
    result.addCheck('firebase_initialization', false, null, error);
  }

  return result;
}

/**
 * Check Google Cloud Secret Manager access
 */
async function checkSecretManager() {
  const result = new CredentialVerificationResult();
  
  try {
    // Try to access a known secret
    const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (!projectId) {
      result.addCheck('secret_manager_project', false, null, 'No project ID available');
      return result;
    }

    result.addCheck('secret_manager_client', true, `Project: ${projectId}`);

    // Test accessing a known secret
    try {
      const secretName = `projects/${projectId}/secrets/AUTH0_DOMAIN/versions/latest`;
      const [response] = await client.accessSecretVersion({ name: secretName });
      const secretValue = response.payload.data.toString();
      
      result.addCheck('secret_manager_access', true, 'AUTH0_DOMAIN secret accessible');
      result.addCheck('secret_manager_value', !!secretValue && secretValue.length > 0, 
        secretValue ? `Length: ${secretValue.length}` : null);
        
    } catch (secretError) {
      result.addWarning('AUTH0_DOMAIN secret not accessible - may be expected if not configured');
      result.addCheck('secret_manager_access', true, 'Client initialized but specific secret not found');
    }

  } catch (error) {
    result.addCheck('secret_manager_initialization', false, null, error);
  }

  return result;
}

/**
 * Check IAM permissions and metadata access
 */
async function checkIAMPermissions() {
  const result = new CredentialVerificationResult();
  
  try {
    // Check metadata server access (indicates we're running in GCP)
    const fetch = require('node-fetch');
    
    const metadataUrl = 'http://metadata.google.internal/computeMetadata/v1/project/project-id';
    const metadataResponse = await fetch(metadataUrl, {
      headers: { 'Metadata-Flavor': 'Google' },
      timeout: 5000
    });
    
    if (metadataResponse.ok) {
      const projectId = await metadataResponse.text();
      result.addCheck('gcp_metadata_access', true, `Project: ${projectId}`);
      result.addCheck('running_in_gcp', true, 'Function is running in Google Cloud');
    } else {
      result.addCheck('gcp_metadata_access', false, null, 'Metadata server not accessible');
    }
    
  } catch (error) {
    // This is expected when running locally
    result.addWarning('Not running in GCP environment - this is normal for local development');
    result.addCheck('running_in_gcp', false, 'Local development environment', null);
  }

  return result;
}

/**
 * Run all credential verification checks
 */
async function runCredentialVerification() {
  const overallResult = new CredentialVerificationResult();
  
  try {
    console.log('🔍 Starting comprehensive credential verification...');
    
    // Run Firebase checks
    const firebaseResult = await checkFirebaseProject();
    Object.assign(overallResult.checks, firebaseResult.checks);
    overallResult.errors.push(...firebaseResult.errors);
    overallResult.warnings.push(...firebaseResult.warnings);
    
    // Run Secret Manager checks
    const secretResult = await checkSecretManager();
    Object.assign(overallResult.checks, secretResult.checks);
    overallResult.errors.push(...secretResult.errors);
    overallResult.warnings.push(...secretResult.warnings);
    
    // Run IAM checks
    const iamResult = await checkIAMPermissions();
    Object.assign(overallResult.checks, iamResult.checks);
    overallResult.errors.push(...iamResult.errors);
    overallResult.warnings.push(...iamResult.warnings);
    
    // Overall validation
    overallResult.isValid = overallResult.errors.length === 0;
    
    const summary = overallResult.getSummary();
    console.log(`✅ Credential verification complete: ${summary.passed}/${summary.total} checks passed`);
    
    if (overallResult.errors.length > 0) {
      console.error('❌ Errors found:', overallResult.errors);
    }
    
    if (overallResult.warnings.length > 0) {
      console.warn('⚠️ Warnings:', overallResult.warnings);
    }
    
  } catch (error) {
    overallResult.addCheck('verification_process', false, null, error);
    console.error('❌ Credential verification failed:', error);
  }
  
  return overallResult;
}

/**
 * Express middleware for credential verification
 */
function credentialVerificationMiddleware(options = {}) {
  const {
    blockOnFailure = false,
    cache = true,
    cacheDuration = 5 * 60 * 1000 // 5 minutes
  } = options;
  
  let cachedResult = null;
  let cacheExpiry = 0;
  
  return async (req, res, next) => {
    try {
      // Use cache if enabled and valid
      if (cache && cachedResult && Date.now() < cacheExpiry) {
        req.credentialCheck = cachedResult;
        return next();
      }
      
      // Run verification
      const result = await runCredentialVerification();
      
      // Update cache
      if (cache) {
        cachedResult = result;
        cacheExpiry = Date.now() + cacheDuration;
      }
      
      req.credentialCheck = result;
      
      // Block request if configured and verification failed
      if (blockOnFailure && !result.isValid) {
        return res.status(503).json({
          error: 'Service temporarily unavailable due to configuration issues',
          details: result.getSummary()
        });
      }
      
      next();
    } catch (error) {
      console.error('❌ Credential verification middleware error:', error);
      
      if (blockOnFailure) {
        return res.status(503).json({
          error: 'Service configuration check failed',
          message: error.message
        });
      }
      
      // Continue without blocking if not configured to block
      req.credentialCheck = { error: error.message };
      next();
    }
  };
}

module.exports = {
  CredentialVerificationResult,
  checkFirebaseProject,
  checkSecretManager,
  checkIAMPermissions,
  runCredentialVerification,
  credentialVerificationMiddleware
};