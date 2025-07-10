#!/usr/bin/env node

/**
 * Helper script to extract Firebase configuration from various sources
 * and add the individual Firebase environment variables to GSM
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'luknerlumina-firebase';

async function getFirebaseConfigFromProject() {
  console.log('🔥 Attempting to get Firebase config from project...');
  
  // Method 1: Try to read from Firebase SDK config file
  const possibleConfigPaths = [
    './firebase-config.json',
    './config/firebase-config.json', 
    './src/config/firebase-config.json',
    './.firebaserc'
  ];
  
  for (const configPath of possibleConfigPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(content);
        console.log(`📄 Found config file: ${configPath}`);
        
        if (config.projects && config.projects.default) {
          console.log(`🎯 Project ID from .firebaserc: ${config.projects.default}`);
          return { projectId: config.projects.default };
        }
        
        if (config.apiKey || config.projectId) {
          console.log(`🎯 Found Firebase config in ${configPath}`);
          return config;
        }
      } catch (error) {
        console.warn(`⚠️  Could not parse ${configPath}: ${error.message}`);
      }
    }
  }
  
  // Method 2: Use gcloud to get project info
  try {
    console.log('🔍 Trying to get Firebase config via gcloud...');
    const { execSync } = await import('child_process');
    
    // Get Firebase web app config
    const appsOutput = execSync('firebase apps:list --project=luknerlumina-firebase', { encoding: 'utf8' });
    console.log('📱 Firebase apps:', appsOutput);
    
  } catch (error) {
    console.warn(`⚠️  Could not get Firebase apps: ${error.message}`);
  }
  
  return null;
}

async function setFirebaseSecretsInGSM(config) {
  const client = new SecretManagerServiceClient();
  
  const firebaseSecrets = [
    { name: 'VITE_FIREBASE_API_KEY', value: config.apiKey },
    { name: 'VITE_FIREBASE_AUTH_DOMAIN', value: config.authDomain },
    { name: 'VITE_FIREBASE_PROJECT_ID', value: config.projectId },
    { name: 'VITE_FIREBASE_STORAGE_BUCKET', value: config.storageBucket },
    { name: 'VITE_FIREBASE_MESSAGING_SENDER_ID', value: config.messagingSenderId },
    { name: 'VITE_FIREBASE_APP_ID', value: config.appId }
  ];
  
  console.log('🔐 Setting Firebase secrets in Google Secret Manager...');
  
  for (const { name, value } of firebaseSecrets) {
    if (!value || value === '...' || value === 'your-value-here') {
      console.warn(`⚠️  Skipping ${name} - no valid value`);
      continue;
    }
    
    try {
      // Create secret if it doesn't exist
      try {
        await client.createSecret({
          parent: `projects/${PROJECT_ID}`,
          secretId: name,
          secret: {
            replication: {
              automatic: {}
            }
          }
        });
        console.log(`✅ Created secret: ${name}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn(`⚠️  Could not create secret ${name}: ${error.message}`);
          continue;
        }
        // Secret already exists, that's fine
      }
      
      // Add secret version
      await client.addSecretVersion({
        parent: `projects/${PROJECT_ID}/secrets/${name}`,
        payload: {
          data: Buffer.from(value)
        }
      });
      
      console.log(`✅ Set ${name} = ${value.substring(0, 10)}...`);
      
    } catch (error) {
      console.error(`❌ Failed to set ${name}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔥 Firebase Configuration Helper');
  console.log('==================================');
  
  // Option 1: Manual input - paste your Firebase config
  if (process.argv.includes('--manual')) {
    console.log(`
📋 Please go to Firebase Console:
   1. Visit: https://console.firebase.google.com/project/${PROJECT_ID}/settings/general
   2. Scroll to "Your apps" section
   3. Select your web app (or create one if none exists)
   4. Copy the config object from the SDK setup

Paste your Firebase config JSON here (or press Ctrl+C to exit):`);
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Firebase config JSON: ', async (input) => {
      try {
        const config = JSON.parse(input);
        console.log('✅ Parsed Firebase config successfully');
        await setFirebaseSecretsInGSM(config);
        console.log('🎉 Firebase secrets updated in GSM! Run pull-secrets.js to update .env');
      } catch (error) {
        console.error(`❌ Invalid JSON: ${error.message}`);
      }
      rl.close();
    });
    
    return;
  }
  
  // Option 2: Auto-detect from project
  const config = await getFirebaseConfigFromProject();
  
  if (config && config.apiKey) {
    console.log('✅ Found Firebase config!');
    console.log('Config:', { ...config, apiKey: config.apiKey.substring(0, 10) + '...' });
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Set these values in Google Secret Manager? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await setFirebaseSecretsInGSM(config);
        console.log('🎉 Firebase secrets updated in GSM! Run pull-secrets.js to update .env');
      } else {
        console.log('❌ Cancelled');
      }
      rl.close();
    });
  } else {
    console.log('❌ Could not auto-detect Firebase config');
    console.log('💡 Try running with --manual flag to enter config manually');
    console.log('   node scripts/get-firebase-config.js --manual');
  }
}

main().catch(console.error);