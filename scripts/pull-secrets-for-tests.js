#!/usr/bin/env node

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { config } from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';

// Load existing .env file first
config();

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';

// Secrets needed for real API tests
const TEST_SECRETS = [
  // Tebra API credentials
  { name: 'TEBRA_USERNAME', envVar: 'VITE_TEBRA_USERNAME' },
  { name: 'TEBRA_PASSWORD', envVar: 'VITE_TEBRA_PASSWORD' },
  { name: 'TEBRA_CUSTOMER_KEY', envVar: 'VITE_TEBRA_CUSTOMER_KEY' },
  { name: 'TEBRA_WSDL_URL', envVar: 'VITE_TEBRA_WSDL_URL' },
  { name: 'TEBRA_PROXY_API_KEY', envVar: 'VITE_TEBRA_PROXY_API_KEY' },
  // Firebase config (for API calls)
  { name: 'FIREBASE_CONFIG', envVar: 'VITE_FIREBASE_CONFIG' },
  { name: 'FIREBASE_API_KEY', envVar: 'VITE_FIREBASE_API_KEY' },
  { name: 'FIREBASE_AUTH_DOMAIN', envVar: 'VITE_FIREBASE_AUTH_DOMAIN' },
  { name: 'FIREBASE_PROJECT_ID', envVar: 'VITE_FIREBASE_PROJECT_ID' },
  { name: 'FIREBASE_STORAGE_BUCKET', envVar: 'VITE_FIREBASE_STORAGE_BUCKET' },
  { name: 'FIREBASE_MESSAGING_SENDER_ID', envVar: 'VITE_FIREBASE_MESSAGING_SENDER_ID' },
  { name: 'FIREBASE_APP_ID', envVar: 'VITE_FIREBASE_APP_ID' },
  // Auth0 (might be needed for authenticated API calls)
  { name: 'AUTH0_DOMAIN', envVar: 'VITE_AUTH0_DOMAIN' },
  { name: 'AUTH0_CLIENT_ID', envVar: 'VITE_AUTH0_CLIENT_ID' },
  { name: 'AUTH0_AUDIENCE', envVar: 'VITE_AUTH0_AUDIENCE' },
  // Google Cloud Project
  { name: 'GOOGLE_CLOUD_PROJECT', envVar: 'GOOGLE_CLOUD_PROJECT' },
];

async function readSecret(secretName) {
  const client = new SecretManagerServiceClient();
  const tryFetch = async (name) => {
    const [version] = await client.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/${name}/versions/latest`,
    });
    return version.payload?.data?.toString() || '';
  };

  try {
    return await tryFetch(secretName);
  } catch (_) {
    // Retry with lowercase variant (common in some projects)
    const altName = secretName.toLowerCase();
    if (altName !== secretName) {
      try {
        return await tryFetch(altName);
      } catch (err2) {
        console.warn(`⚠️  Could not read secret ${secretName} (or ${altName}):`, err2.message);
        return null;
      }
    }
    console.warn(`⚠️  Could not read secret ${secretName}:`, _.message);
    return null;
  }
}

async function loadSecretsAndRunTests() {
  console.log('🔐 Loading secrets from Google Secret Manager for tests...');
  
  // Create environment object with existing vars
  const testEnv = { ...process.env };
  
  // Add flag to enable real API tests
  testEnv.RUN_REAL_API_TESTS = 'true';
  
  // Pull each secret
  for (const { name, envVar } of TEST_SECRETS) {
    const value = await readSecret(name);
    if (value) {
      testEnv[envVar] = value;
      // Also set without VITE_ prefix for direct access
      testEnv[name] = value;
      
      // Parse Firebase config if it's JSON
      if (envVar === 'VITE_FIREBASE_CONFIG' && value.startsWith('{')) {
        try {
          const config = JSON.parse(value);
          // Also set individual Firebase env vars from the config
          if (config.apiKey) testEnv.VITE_FIREBASE_API_KEY = config.apiKey;
          if (config.authDomain) testEnv.VITE_FIREBASE_AUTH_DOMAIN = config.authDomain;
          if (config.projectId) testEnv.VITE_FIREBASE_PROJECT_ID = config.projectId;
          if (config.storageBucket) testEnv.VITE_FIREBASE_STORAGE_BUCKET = config.storageBucket;
          if (config.messagingSenderId) testEnv.VITE_FIREBASE_MESSAGING_SENDER_ID = config.messagingSenderId;
          if (config.appId) testEnv.VITE_FIREBASE_APP_ID = config.appId;
        } catch (e) {
          console.warn(`⚠️  Could not parse FIREBASE_CONFIG as JSON`);
        }
      }
      
      console.log(`✅ Loaded ${envVar}`);
    } else {
      console.log(`⚠️  ${envVar} not found in GSM`);
    }
  }
  
  // Override with the correct API key from local .env if available
  try {
    const dotenv = require('dotenv');
    const envConfig = dotenv.config();
    if (envConfig.parsed && envConfig.parsed.VITE_TEBRA_PROXY_API_KEY) {
      const localApiKey = envConfig.parsed.VITE_TEBRA_PROXY_API_KEY;
      console.log(`📍 Local .env API key: ${localApiKey.substring(0,10)}... (length: ${localApiKey.length})`);
      console.log(`📍 GSM API key: ${testEnv.VITE_TEBRA_PROXY_API_KEY?.substring(0,10)}... (length: ${testEnv.VITE_TEBRA_PROXY_API_KEY?.length})`);
      if (localApiKey.length === 44) { // The correct key is 44 chars
        console.log('✅ Overriding API key with correct value from local .env');
        testEnv.VITE_TEBRA_PROXY_API_KEY = localApiKey;
        testEnv.TEBRA_PROXY_API_KEY = localApiKey;
      }
    }
  } catch (e) {
    console.error('⚠️  Error loading .env file:', e.message);
  }
  
  // Show final API key that will be used
  console.log(`🔑 Final API key to use: ${testEnv.VITE_TEBRA_PROXY_API_KEY?.substring(0,10)}... (length: ${testEnv.VITE_TEBRA_PROXY_API_KEY?.length})`);
  
  console.log('🧪 Running real API tests with loaded secrets...\n');
  
  // Copy the environment variables to the current process first
  for (const [key, value] of Object.entries(testEnv)) {
    process.env[key] = value;
  }
  
  // Run the tests with the loaded environment
  const testProcess = spawn('npm', ['test', '--', '--selectProjects', 'real-api'], {
    env: testEnv,
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('exit', (code) => {
    process.exit(code);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadSecretsAndRunTests().catch(error => {
    console.error('❌ Failed to load secrets and run tests:', error);
    process.exit(1);
  });
}

export { loadSecretsAndRunTests };