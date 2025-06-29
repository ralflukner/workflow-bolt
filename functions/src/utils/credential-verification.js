/**
 * Firebase and Google Cloud Credential Verification System
 * 
 * This module provides comprehensive credential verification for Firebase Functions
 * to ensure proper authentication and service connectivity before function execution.
 */

const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const secretsClient = new SecretManagerServiceClient();

function ok(result){return {status:'success', ...result};}
function warn(message, extra){return {status:'warning', message, ...extra};}
function fail(message, extra){return {status:'failed', message, ...extra};}

async function checkFirebaseProject() {
  try {
    const app = getAdminApp();
    const pid =
      process.env.GCLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      app.options.projectId;
    if (!pid) throw new Error('Project id not set');
    return ok({ projectId: pid });
  } catch (e) {
    return fail(e.message);
  }
}

async function checkAdmin() {
  try {
    const app = getAdminApp();
    return ok({ projectId: app.options.projectId, name: app.name });
  } catch (e) {
    return fail(e.message);
  }
}

async function checkFirestore(){
  try{const ref=admin.firestore().doc('_cred_check/tmp'); await ref.set({ts:Date.now()}); await ref.delete(); return ok({});}
  catch(e){return fail(e.message);} }

async function checkAuth0(){
 try{
  const {AUTH0_DOMAIN:domain, AUTH0_AUDIENCE:aud}=process.env;
  if(!domain||!aud) throw new Error('Auth0 env not set');
  return ok({domain,audience:aud});
 }catch(e){return fail(e.message);} }

async function checkSecretManager(){
  try{
   const projectId=process.env.GCLOUD_PROJECT||admin.app().options.projectId;
   const [secs]=await secretsClient.listSecrets({parent:`projects/${projectId}`,pageSize:1});
   return ok({secretCount:secs.length});
  }catch(e){return warn(e.message);} }

async function checkServiceAccount(){
  try{
    const res=await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email',{headers:{'Metadata-Flavor':'Google'}});
    if(!res.ok) throw new Error('metadata HTTP '+res.status);
    const email=await res.text();
    return ok({email});
  }catch(e){return warn(e.message);} }

// --------------------------------------------
// Tebra EHR integration credential check
// --------------------------------------------

async function checkTebra() {
  try {
    const cfg = {
      clientId: process.env.TEBRA_CLIENT_ID,
      cloudRunUrl: process.env.TEBRA_CLOUD_RUN_URL,
      hasSecret: !!process.env.TEBRA_CLIENT_SECRET,
      hasApiKey: !!process.env.TEBRA_INTERNAL_API_KEY
    };

    const missing = [];
    if (!cfg.clientId) missing.push('TEBRA_CLIENT_ID');
    if (!cfg.cloudRunUrl) missing.push('TEBRA_CLOUD_RUN_URL');

    if (missing.length) {
      return fail(`Missing Tebra vars: ${missing.join(', ')}`);
    }

    if (!cfg.cloudRunUrl.startsWith('https://')) {
      return warn('TEBRA_CLOUD_RUN_URL should be https', cfg);
    }

    return ok(cfg);
  } catch (e) {
    return fail(e.message);
  }
}

const checks=[
  ['firebaseProject',checkFirebaseProject],
  ['firebaseAdmin',checkAdmin],
  ['firestore',checkFirestore],
  ['auth0',checkAuth0],
  ['tebra',checkTebra],
  ['secretManager',checkSecretManager],
  ['serviceAccount',checkServiceAccount]
];

async function runCredentialVerification() {
  const results = {};

  const settled = await Promise.all(
    checks.map(async ([name, fn]) => {
      try {
        return [name, await fn()];
      } catch (e) {
        return [name, fail(`Unexpected error: ${e.message}`)];
      }
    })
  );
  for(const [n,r] of settled) results[n]=r;
  const statuses=Object.values(results).map(r=>r.status);
  return {
    checks:results,
    summary:{
      totalChecks:statuses.length,
      passed:statuses.filter(s=>'success'===s).length,
      warnings:statuses.filter(s=>'warning'===s).length,
      failed:statuses.filter(s=>'failed'===s).length
    },
    isValid: !statuses.includes('failed'),
  };
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

// ------------------------------------------------------------
// 🔚 Export public API (place at end so all refs are defined)
// ------------------------------------------------------------

module.exports = {
  // individual checks
  checkFirebaseProject,
  checkAdmin,
  checkFirestore,
  checkAuth0,
  checkTebra,
  checkSecretManager,
  checkServiceAccount,
  // main runner & middleware
  runCredentialVerification,
  credentialVerificationMiddleware,
  // helpers for unit-testing
  _helpers: { ok, warn, fail }
};

// Helper: ensure there is a default Firebase app and return it
function getAdminApp() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.app();
}