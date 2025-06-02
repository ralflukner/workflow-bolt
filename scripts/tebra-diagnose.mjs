#!/usr/bin/env node

/**
 * Tebra / Firebase diagnostic CLI
 *
 * Usage: npm run diagnose
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import https from 'https';

const logSection = (title) => {
  console.log(`\n=== ${title} ===`);
};

const requiredFirebaseVars = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const requiredTebraVars = [
  'REACT_APP_TEBRA_CUSTKEY',
  'REACT_APP_TEBRA_WSDL_URL'
];

const sensitiveTebraVars = [
  'REACT_APP_TEBRA_USERNAME',
  'REACT_APP_TEBRA_PASSWORD'
];

function checkEnv(vars) {
  const loaded = [];
  const missing = [];

  vars.forEach((v) => {
    if (process.env[v]) loaded.push(v);
    else missing.push(v);
  });

  return { loaded, missing };
}

function printEnvStatus(name, vars) {
  const { loaded, missing } = checkEnv(vars);
  console.log(`${name} env vars:`);
  console.log(`  loaded (${loaded.length}): ${loaded.join(', ')}`);
  if (missing.length) {
    console.log(`  missing (${missing.length}): ${missing.join(', ')}`);
  } else {
    console.log('  ✅ All variables present');
  }
  return missing.length === 0;
}

function printSensitiveEnvStatus(name, vars) {
  const { loaded, missing } = checkEnv(vars);
  console.log(`${name} sensitive vars:`);
  console.log(`  loaded (${loaded.length}): ${loaded.map(v => v.replace('REACT_APP_TEBRA_', '')).join(', ')}`);
  if (missing.length) {
    console.log(`  missing (${missing.length}): ${missing.map(v => v.replace('REACT_APP_TEBRA_', '')).join(', ')}`);
  } else {
    console.log('  ✅ All credentials present');
  }
  return missing.length === 0;
}

async function testCallableFunction(projectId, functionName) {
  const url = `https://us-central1-${projectId}.cloudfunctions.net/${functionName}`;

  return new Promise((resolve) => {
    const data = JSON.stringify({ data: {} });

    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(body);
              resolve({ success: true, statusCode: res.statusCode, body: parsed });
            } catch {
              resolve({ success: false, statusCode: res.statusCode, body });
            }
          } else {
            resolve({ success: false, statusCode: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('🔧 Tebra / Firebase Diagnostic');

  // 1. Environment Variables
  logSection('Environment Variables');
  const firebaseReady = printEnvStatus('Firebase', requiredFirebaseVars);
  const tebraReady = printEnvStatus('Tebra', requiredTebraVars);
  const tebraCredsReady = printSensitiveEnvStatus('Tebra', sensitiveTebraVars);

  // 2. Test Firebase Function connectivity if env vars are ready
  if (firebaseReady) {
    logSection('Testing Cloud Function tebraTestConnection');
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const start = Date.now();
    const result = await testCallableFunction(projectId, 'tebraTestConnection');
    const duration = Date.now() - start;

    if (result.success) {
      console.log(`✅ Success in ${duration}ms`);
      console.dir(result.body, { depth: null });
    } else {
      console.log(`❌ Failed (HTTP ${result.statusCode ?? 'ERR'}) in ${duration}ms`);
      if (result.body) console.log('Response:', result.body);
      if (result.error) console.log('Error:', result.error);
      console.log('\nTip: Ensure the function allows unauthenticated calls or provide Firebase auth token.');
    }
  } else {
    console.log('\n⚠️  Skipping Cloud Function test – missing Firebase configuration');
  }
})(); 