#!/usr/bin/env node
/**
 * Get Firebase ID Token for Testing
 * This script helps obtain a Firebase ID token for testing authenticated endpoints
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Firebase Admin SDK with application default credentials
let app;
try {
  app = initializeApp({
    credential: applicationDefault(),
    projectId: 'luknerlumina-firebase'
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK');
  console.error('Error:', error.message);
  console.error('Make sure GOOGLE_APPLICATION_CREDENTIALS is set or run: gcloud auth application-default login');
  process.exit(1);
}

async function getCustomToken() {
  try {
    // Create a custom token for testing
    const uid = 'test-user-' + Date.now();
    const customToken = await getAuth().createCustomToken(uid, {
      test: true,
      email: 'test@luknerlumina.com'
    });
    
    console.log('✅ Firebase Custom Token Generated:');
    console.log(customToken);
    console.log('\nTo use this token:');
    console.log('1. Exchange it for an ID token using Firebase Auth SDK');
    console.log('2. Or use the test-firebase-tebra-endpoint.sh script');
    
    return customToken;
  } catch (error) {
    console.error('❌ Error creating custom token:', error);
    process.exit(1);
  }
}

// Run the function
getCustomToken().then(() => {
  process.exit(0);
});