#!/usr/bin/env node

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Unset conflicting Google environment variables to ensure clean auth
const googleEnvVars = [
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_CLOUD_KEYFILE",
  "GCLOUD_KEYFILE",
  "GOOGLE_CLOUD_PROJECT",
  "GCLOUD_PROJECT",
  "GCP_PROJECT"
];

console.log("🧹 Clearing potentially conflicting environment variables...");
googleEnvVars.forEach(varName => {
  delete process.env[varName];
});
// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

// Map "alias" env vars → canonical env var whose value should be reused when
// the alias secret is missing.  This lets us write both front-end (VITE_*) and
// back-end env var names to the .env file without having to store two copies of
// every secret in GSM.
// Example: AUTH0_DOMAIN will mirror VITE_AUTH0_DOMAIN if it isn't found as a
// standalone secret.
const ALIAS_ENV_VARS = {
  // Auth0
  AUTH0_DOMAIN: 'VITE_AUTH0_DOMAIN',
  AUTH0_CLIENT_ID: 'VITE_AUTH0_CLIENT_ID',
  AUTH0_REDIRECT_URI: 'VITE_AUTH0_REDIRECT_URI',
  AUTH0_AUDIENCE: 'VITE_AUTH0_AUDIENCE',
  AUTH0_SCOPE: 'VITE_AUTH0_SCOPE',

  // Tebra – many server components expect un-prefixed vars
  TEBRA_PASSWORD: 'VITE_TEBRA_PASSWORD',
  TEBRA_CUSTOMER_KEY: 'VITE_TEBRA_CUSTOMER_KEY',
  TEBRA_WSDL_URL: 'VITE_TEBRA_WSDL_URL',

  // Cloud project id (backend code expects GCLOUD_PROJECT or FIREBASE_PROJECT_ID)
  GCLOUD_PROJECT: 'GOOGLE_CLOUD_PROJECT',
  FIREBASE_PROJECT_ID: 'GOOGLE_CLOUD_PROJECT',
  // Frontend needs VITE_TEBRA_CLOUD_RUN_URL - map from backend secret
  VITE_TEBRA_CLOUD_RUN_URL: 'TEBRA_CLOUD_RUN_URL',
};

const SECRETS_TO_PULL = [
  // Auth0 secrets
  { name: 'VITE_AUTH0_DOMAIN', envVar: 'VITE_AUTH0_DOMAIN' },
  { name: 'VITE_AUTH0_CLIENT_ID', envVar: 'VITE_AUTH0_CLIENT_ID' },
  { name: 'VITE_AUTH0_REDIRECT_URI', envVar: 'VITE_AUTH0_REDIRECT_URI' },
  { name: 'VITE_AUTH0_AUDIENCE', envVar: 'VITE_AUTH0_AUDIENCE' },
  { name: 'VITE_AUTH0_SCOPE', envVar: 'VITE_AUTH0_SCOPE' },
  // Tebra secrets
  { name: 'VITE_TEBRA_PASSWORD', envVar: 'VITE_TEBRA_PASSWORD' },
  { name: 'VITE_TEBRA_CUSTOMER_KEY', envVar: 'VITE_TEBRA_CUSTOMER_KEY' },
  { name: 'VITE_TEBRA_WSDL_URL', envVar: 'VITE_TEBRA_WSDL_URL' },
  // Firebase secrets - individual variables
  { name: 'VITE_FIREBASE_API_KEY', envVar: 'VITE_FIREBASE_API_KEY' },
  { name: 'VITE_FIREBASE_AUTH_DOMAIN', envVar: 'VITE_FIREBASE_AUTH_DOMAIN' },
  { name: 'VITE_FIREBASE_PROJECT_ID', envVar: 'VITE_FIREBASE_PROJECT_ID' },
  { name: 'VITE_FIREBASE_STORAGE_BUCKET', envVar: 'VITE_FIREBASE_STORAGE_BUCKET' },
  { name: 'VITE_FIREBASE_MESSAGING_SENDER_ID', envVar: 'VITE_FIREBASE_MESSAGING_SENDER_ID' },
  { name: 'VITE_FIREBASE_APP_ID', envVar: 'VITE_FIREBASE_APP_ID' },
  // Gmail OAuth2 secrets
  { name: 'GMAIL_CLIENT_ID', envVar: 'GMAIL_CLIENT_ID' },
  { name: 'GMAIL_CLIENT_SECRET', envVar: 'GMAIL_CLIENT_SECRET' },
  { name: 'GMAIL_REFRESH_TOKEN', envVar: 'GMAIL_REFRESH_TOKEN' },
  { name: 'GMAIL_OAUTH_CLIENT_ID', envVar: 'GMAIL_OAUTH_CLIENT_ID' },
  { name: 'GMAIL_OAUTH_CLIENT_SECRET', envVar: 'GMAIL_OAUTH_CLIENT_SECRET' },
  // Gmail Service Account secrets (for Domain-Wide Delegation)
  { name: 'GMAIL_SERVICE_ACCOUNT_EMAIL', envVar: 'GMAIL_SERVICE_ACCOUNT_EMAIL' },
  { name: 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY', envVar: 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY' },
  // Patient encryption key
  { name: 'VITE_PATIENT_ENCRYPTION_KEY', envVar: 'VITE_PATIENT_ENCRYPTION_KEY' },
  // --- Runtime configuration / proxy ---
  { name: 'VITE_TEBRA_PROXY_API_KEY', envVar: 'VITE_TEBRA_PROXY_API_KEY' },
  { name: 'VITE_FIREBASE_CONFIG', envVar: 'VITE_FIREBASE_CONFIG' },
  { name: 'GOOGLE_CLOUD_PROJECT', envVar: 'GOOGLE_CLOUD_PROJECT' },
  // Backend-only secret
  { name: 'TEBRA_CLOUD_RUN_URL', envVar: 'TEBRA_CLOUD_RUN_URL' },
  // Vikunja Database Password
  { name: 'vikunja-db-secret', envVar: 'VIKUNJA_DATABASE_PASSWORD' },
];

// We intentionally do NOT add alias names to SECRETS_TO_PULL – they will be
// replicated from their canonical counterpart after GSM fetch. This avoids
// confusing "secret not found" warnings for variables that only exist as
// aliases.

async function readSecret(secretName) {
  const client = new SecretManagerServiceClient();
  const tryFetch = async (name) => {
    const [version] = await client.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/${name}/versions/latest`,
    });
    return version.payload?.data?.toString() || '';
  };

  try {
    const rawValue = await tryFetch(secretName);
    
    // Check for trailing newlines - this is a critical issue that causes JWT verification failures
    if (rawValue && rawValue.endsWith('\n')) {
      console.error(`❌ CRITICAL: Secret ${secretName} contains trailing newline!`);
      console.error(`   This will cause authentication failures. Run fix-secret-newlines.sh to fix.`);
      console.error(`   Raw value ends with: ${JSON.stringify(rawValue.slice(-5))}`);
      throw new Error(`Secret ${secretName} has trailing newline - authentication will fail`);
    }
    
    return rawValue;
  } catch (err) {
    if (err.message.includes('trailing newline')) {
      throw err; // Re-throw newline errors as critical
    }
    console.warn(`⚠️  Warning: Could not read secret ${secretName}: ${err.message}`);
    return null;
  }
}

async function validateSecretFunctionality(envMap) {
  // Test Auth0 domain accessibility
  if (envMap['VITE_AUTH0_DOMAIN']) {
    try {
      const domain = envMap['VITE_AUTH0_DOMAIN'].replace(/['"]/g, '');
      const jwksUrl = `https://${domain}/.well-known/jwks.json`;
      console.log(`🔍 Testing Auth0 domain: ${domain}`);
      
      // Use dynamic import for node-fetch
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(jwksUrl, { timeout: 10000 });
      
      if (response.ok) {
        console.log('✅ Auth0 domain is accessible');
      } else {
        console.error(`❌ Auth0 domain returned HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Auth0 domain test failed: ${error.message}`);
    }
  }
  
  // Validate Auth0 audience format
  if (envMap['VITE_AUTH0_AUDIENCE']) {
    const audience = envMap['VITE_AUTH0_AUDIENCE'].replace(/['"]/g, '');
    if (audience.startsWith('https://') || audience.includes('api')) {
      console.log('✅ Auth0 audience format looks correct');
    } else {
      console.warn(`⚠️  Auth0 audience format unusual: ${audience}`);
    }
  }
  
  // Validate Tebra WSDL URL if present
  if (envMap['VITE_TEBRA_WSDL_URL']) {
    const wsdlUrl = envMap['VITE_TEBRA_WSDL_URL'].replace(/['"]/g, '');
    if (wsdlUrl.startsWith('https://') && wsdlUrl.includes('wsdl')) {
      console.log('✅ Tebra WSDL URL format looks correct');
    } else {
      console.warn(`⚠️  Tebra WSDL URL format unusual: ${wsdlUrl.substring(0, 50)}...`);
    }
  }
}

async function pullSecrets() {
  console.log('🔐 Pulling secrets from Google Secret Manager...');

  const envContent = [];
  const envMap = {}; // envVar -> value (after quoting/escaping)
  const existingEnvPath = path.join(process.cwd(), '.env');

  // Backup existing .env file (if present) instead of merging its content.
  // The backup file is named .env.bak.<YYYYMMDDHHMMSS> and kept in the same
  // directory so developers can diff or restore if needed.
  let existingEnvBackedUp = false;
  if (fs.existsSync(existingEnvPath)) {
    const ts = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const backupPath = path.join(process.cwd(), `.env.bak.${ts}`);
    fs.copyFileSync(existingEnvPath, backupPath);
    existingEnvBackedUp = true;
    console.log(`📦 Existing .env backed up to ${path.basename(backupPath)}`);
  }

  // Add header
  envContent.push('# Auto-generated from Google Secret Manager');
  envContent.push(`# Generated at: ${new Date().toISOString()}`);
  envContent.push('');

  // Pull each secret
  for (const { name, envVar } of SECRETS_TO_PULL) {
    const value = await readSecret(name);
    if (value) {
      // Convert real newlines to \n so they fit on one line
      let safeVal = value.replace(/\n/g, '\\n');
      // Quote if it contains spaces, tabs, or literal \n sequences
      if (/\s/.test(safeVal)) {
        safeVal = `"${safeVal.replace(/"/g, '\\"')}"`;
      }
      envContent.push(`${envVar}=${safeVal}`);
      envMap[envVar] = safeVal;
      // Mask sensitive values in logs
      const maskedValue = envVar.match(/PASSWORD|PRIVATE_KEY|TOKEN|SECRET/i)
        ? '********'
        : safeVal.substring(0, 10) + '...';
      console.log(`✅ ${envVar} = ${maskedValue}`);
    } else {
      console.log(`⚠️  ${envVar} = (not found in GSM)`);
    }
  }

  // -------------------------------------------------------------------
  // Step 2:  Write alias env vars that weren't retrieved directly but whose
  //          canonical counterpart was.
  // -------------------------------------------------------------------
  for (const [aliasVar, primaryVar] of Object.entries(ALIAS_ENV_VARS)) {
    if (envMap[aliasVar]) continue; // alias already set from GSM
    if (!envMap[primaryVar]) continue; // no value to mirror

    envContent.push(`${aliasVar}=${envMap[primaryVar]}`);
    envMap[aliasVar] = envMap[primaryVar];
    console.log(`🔁 ${aliasVar} mapped from ${primaryVar}`);
  }

  // -------------------------------------------------------------------
  // Step 2.5: Handle Firebase config - derive individual vars if missing
  // -------------------------------------------------------------------
  const firebaseVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingFirebaseVars = firebaseVars.filter(v => !envMap[v]);
  
  if (missingFirebaseVars.length > 0) {
    console.log(`🔥 ${missingFirebaseVars.length} Firebase variables missing from GSM, attempting to derive...`);
    
    // Try to get values from VITE_FIREBASE_CONFIG if it exists
    if (envMap['VITE_FIREBASE_CONFIG']) {
      try {
        const firebaseConfig = JSON.parse(envMap['VITE_FIREBASE_CONFIG'].replace(/"/g, ''));
        const configMap = {
          'VITE_FIREBASE_API_KEY': firebaseConfig.apiKey,
          'VITE_FIREBASE_AUTH_DOMAIN': firebaseConfig.authDomain,
          'VITE_FIREBASE_PROJECT_ID': firebaseConfig.projectId,
          'VITE_FIREBASE_STORAGE_BUCKET': firebaseConfig.storageBucket,
          'VITE_FIREBASE_MESSAGING_SENDER_ID': firebaseConfig.messagingSenderId,
          'VITE_FIREBASE_APP_ID': firebaseConfig.appId
        };
        
        for (const [varName, value] of Object.entries(configMap)) {
          if (!envMap[varName] && value && value !== '...' && value !== 'your-value-here') {
            envContent.push(`${varName}=${value}`);
            envMap[varName] = value;
            console.log(`🔥 ${varName} derived from VITE_FIREBASE_CONFIG`);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not parse VITE_FIREBASE_CONFIG: ${error.message}`);
      }
    }
    
    // Use predictable defaults for missing Firebase config based on project ID
    const projectId = envMap['GOOGLE_CLOUD_PROJECT'] || 'luknerlumina-firebase';
    const defaults = {
      'VITE_FIREBASE_PROJECT_ID': projectId,
      'VITE_FIREBASE_AUTH_DOMAIN': `${projectId}.firebaseapp.com`,
      'VITE_FIREBASE_STORAGE_BUCKET': `${projectId}.appspot.com`
    };
    
    for (const [varName, defaultValue] of Object.entries(defaults)) {
      if (!envMap[varName]) {
        envContent.push(`${varName}=${defaultValue}`);
        envMap[varName] = defaultValue;
        console.log(`🔥 ${varName} set to default: ${defaultValue}`);
      }
    }
    
    // For API key, messaging sender ID, and app ID - these need to come from Firebase Console
    const stillMissing = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID']
      .filter(v => !envMap[v]);
    
    if (stillMissing.length > 0) {
      console.warn(`⚠️  Still missing Firebase secrets (need to be added to GSM):`);
      for (const missing of stillMissing) {
        console.warn(`    ${missing} - Get from Firebase Console → Project Settings`);
        // Add placeholder so the env check doesn't fail
        envContent.push(`${missing}=PLACEHOLDER-GET-FROM-FIREBASE-CONSOLE`);
        envMap[missing] = 'PLACEHOLDER-GET-FROM-FIREBASE-CONSOLE';
      }
    }
  }

  // -------------------------------------------------------------------
  // Step 3: Comprehensive validation of secret values
  // -------------------------------------------------------------------
  console.log('\n🔍 Validating secret values...');
  
  // Check for placeholder values
  const placeholderRegex = /example\.com|placeholder|changeme|dummy|YOUR[_-]|test[_-]value|replace[_-]me|fix[_-]me|todo|temp/i;
  const badEntries = Object.entries(envMap).filter(([, v]) => placeholderRegex.test(v));
  
  // Check for suspicious values
  const suspiciousRegex = /^(null|undefined|empty|tbd|pending|missing)$/i;
  const suspiciousEntries = Object.entries(envMap).filter(([, v]) => suspiciousRegex.test(v));
  
  // Check for values that are too short (likely incomplete)
  const tooShortEntries = Object.entries(envMap).filter(([k, v]) => {
    // Skip certain vars that can legitimately be short
    if (k.includes('REDIRECT_URI') || k.includes('SCOPE')) return false;
    return v.replace(/['"]/g, '').length < 5;
  });
  
  // Check critical Auth0 and Tebra secrets specifically
  const criticalSecrets = ['VITE_AUTH0_DOMAIN', 'VITE_AUTH0_CLIENT_ID', 'VITE_AUTH0_AUDIENCE'];
  const missingCritical = criticalSecrets.filter(key => !envMap[key] || envMap[key] === '(not found in GSM)');
  
  let hasErrors = false;
  
  if (badEntries.length) {
    console.error('❌ CRITICAL: Placeholder values detected in secrets:');
    for (const [k, v] of badEntries) {
      console.error(`    ${k} = ${v.slice(0, 40)}…`);
    }
    hasErrors = true;
  }
  
  if (suspiciousEntries.length) {
    console.error('❌ CRITICAL: Suspicious placeholder values detected:');
    for (const [k, v] of suspiciousEntries) {
      console.error(`    ${k} = ${v}`);
    }
    hasErrors = true;
  }
  
  if (tooShortEntries.length) {
    console.error('⚠️  WARNING: Suspiciously short secret values:');
    for (const [k, v] of tooShortEntries) {
      console.error(`    ${k} = ${v} (${v.replace(/['"]/g, '').length} chars)`);
    }
  }
  
  if (missingCritical.length) {
    console.error('❌ CRITICAL: Missing critical authentication secrets:');
    for (const key of missingCritical) {
      console.error(`    ${key} - Required for Auth0 authentication`);
    }
    hasErrors = true;
  }
  
  if (hasErrors) {
    console.error('\n💥 CRITICAL ERRORS FOUND: Cannot proceed with authentication setup.');
    console.error('Please fix the above secrets in Google Secret Manager before continuing.');
    console.error('\n🔧 To fix:');
    console.error('1. Update secrets in Google Cloud Console → Secret Manager');
    console.error('2. Ensure no trailing newlines: run fix-secret-newlines.sh');
    console.error('3. Re-run this script: node scripts/pull-secrets.js');
    process.exit(1);
  }
  
  console.log('✅ All secret validations passed!');

  // NOTE: We intentionally do NOT merge the previous .env contents. Developers
  // should review the backup file and manually copy over anything that is
  // still required (e.g., purely local dev variables). This avoids duplicated
  // or outdated secrets lingering at the bottom of the new .env.

  // Write to .env file
  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent.join('\n') + '\n');

  console.log(`📝 Wrote ${envContent.length} lines to .env${existingEnvBackedUp ? ' (old file backed up)' : ''}`);
  
  // Final validation: verify critical secrets are functional
  console.log('\n🧪 Running functional validation of critical secrets...');
  await validateSecretFunctionality(envMap);
  
  console.log('\n🎉 Secrets pulled and validated successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: node test-deployed-functions.cjs (to verify Firebase Functions)');
  console.log('2. Test authentication flow in browser');
  console.log('3. Clear browser cache if needed: localStorage.clear(); location.reload();');
}

// ---------------------------------------------------------------------------
// Dev shortcut: if SKIP_GSM=1 then merge .env.local (if present) and exit OK.
// This lets local builds proceed without GSM access.
// ---------------------------------------------------------------------------
if (process.env.SKIP_GSM === '1' || process.env.NODE_ENV === 'development') {
  const fs = await import('fs');
  const path = await import('path');
  const localEnvPath = path.join(process.cwd(), 'local.env');
  const destPath = path.join(process.cwd(), '.env');

  if (fs.existsSync(localEnvPath)) {
    fs.copyFileSync(localEnvPath, destPath);
    console.log('🔧 SKIP_GSM set – copied .env.local to .env and skipped GSM pull');
  } else {
    console.warn('⚠️  SKIP_GSM set but .env.local not found; creating stub .env');
    fs.writeFileSync(destPath, '# Stub env generated because SKIP_GSM=1\n');
  }
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  pullSecrets().catch(error => {
    console.error('❌ Failed to pull secrets:', error);
    process.exit(1);
  });
}

export { pullSecrets, SECRETS_TO_PULL }; 
