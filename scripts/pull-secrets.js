#!/usr/bin/env node

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';
const SECRETS_TO_PULL = [
  // Auth0 secrets
  { name: 'AUTH0_DOMAIN', envVar: 'VITE_AUTH0_DOMAIN' },
  { name: 'AUTH0_CLIENT_ID', envVar: 'VITE_AUTH0_CLIENT_ID' },
  { name: 'AUTH0_REDIRECT_URI', envVar: 'VITE_AUTH0_REDIRECT_URI' },
  { name: 'AUTH0_AUDIENCE', envVar: 'VITE_AUTH0_AUDIENCE' },
  { name: 'AUTH0_SCOPE', envVar: 'VITE_AUTH0_SCOPE' },
  // Tebra secrets
  { name: 'TEBRA_USERNAME', envVar: 'VITE_TEBRA_USERNAME' },
  { name: 'TEBRA_PASSWORD', envVar: 'VITE_TEBRA_PASSWORD' },
  { name: 'TEBRA_CUSTOMER_KEY', envVar: 'VITE_TEBRA_CUSTOMER_KEY' },
  { name: 'TEBRA_WSDL_URL', envVar: 'VITE_TEBRA_WSDL_URL' },
];

async function readSecret(secretName) {
  try {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });
    return version.payload?.data?.toString() || '';
  } catch (error) {
    console.warn(`Warning: Could not read secret ${secretName}:`, error.message);
    return null;
  }
}

async function pullSecrets() {
  console.log('🔐 Pulling secrets from Google Secret Manager...');
  
  const envContent = [];
  const existingEnvPath = path.join(process.cwd(), '.env');
  
  // Read existing .env file if it exists
  let existingEnv = '';
  if (fs.existsSync(existingEnvPath)) {
    existingEnv = fs.readFileSync(existingEnvPath, 'utf8');
    console.log('📄 Found existing .env file');
  }
  
  // Add header
  envContent.push('# Auto-generated from Google Secret Manager');
  envContent.push(`# Generated at: ${new Date().toISOString()}`);
  envContent.push('');
  
  // Pull each secret
  for (const { name, envVar } of SECRETS_TO_PULL) {
    const value = await readSecret(name);
    if (value) {
      envContent.push(`${envVar}=${value}`);
      // Mask sensitive values in logs
      const maskedValue = envVar.includes('PASSWORD') ? '********' : value.substring(0, 10) + '...';
      console.log(`✅ ${envVar} = ${maskedValue}`);
    } else {
      console.log(`⚠️  ${envVar} = (not found in GSM)`);
    }
  }
  
  // Add any existing non-VITE_ variables
  if (existingEnv) {
    envContent.push('');
    envContent.push('# Existing environment variables');
    const existingLines = existingEnv.split('\n').filter(line => 
      line.trim() && 
      !line.startsWith('#') && 
      !line.startsWith('VITE_')
    );
    envContent.push(...existingLines);
  }
  
  // Write to .env file
  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent.join('\n') + '\n');
  
  console.log(`📝 Wrote ${envContent.length} lines to .env`);
  console.log('🎉 Secrets pulled successfully!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  pullSecrets().catch(error => {
    console.error('❌ Failed to pull secrets:', error);
    process.exit(1);
  });
}

export { pullSecrets }; 