#!/usr/bin/env node

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';
const SECRETS_TO_PULL = [
  // Auth0 secrets
  { name: 'VITE_AUTH0_DOMAIN', envVar: 'VITE_AUTH0_DOMAIN' },
  { name: 'VITE_AUTH0_CLIENT_ID', envVar: 'VITE_AUTH0_CLIENT_ID' },
  { name: 'VITE_AUTH0_REDIRECT_URI', envVar: 'VITE_AUTH0_REDIRECT_URI' },
  { name: 'VITE_AUTH0_AUDIENCE', envVar: 'VITE_AUTH0_AUDIENCE' },
  { name: 'VITE_AUTH0_SCOPE', envVar: 'VITE_AUTH0_SCOPE' },
  // Tebra secrets
  { name: 'VITE_TEBRA_USERNAME', envVar: 'VITE_TEBRA_USERNAME' },
  { name: 'VITE_TEBRA_PASSWORD', envVar: 'VITE_TEBRA_PASSWORD' },
  { name: 'VITE_TEBRA_CUSTOMER_KEY', envVar: 'VITE_TEBRA_CUSTOMER_KEY' },
  { name: 'VITE_TEBRA_WSDL_URL', envVar: 'VITE_TEBRA_WSDL_URL' },
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
  } catch (err) {
    console.warn(`Warning: Could not read secret ${secretName}:`, err.message);
    return null;
  }
}

async function pullSecrets() {
  console.log('🔐 Pulling secrets from Google Secret Manager...');

  const envContent = [];
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
      // Mask sensitive values in logs
      const maskedValue = envVar.match(/PASSWORD|PRIVATE_KEY|TOKEN|SECRET/i)
        ? '********'
        : safeVal.substring(0, 10) + '...';
      console.log(`✅ ${envVar} = ${maskedValue}`);
    } else {
      console.log(`⚠️  ${envVar} = (not found in GSM)`);
    }
  }

  // NOTE: We intentionally do NOT merge the previous .env contents. Developers
  // should review the backup file and manually copy over anything that is
  // still required (e.g., purely local dev variables). This avoids duplicated
  // or outdated secrets lingering at the bottom of the new .env.

  // Write to .env file
  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent.join('\n') + '\n');

  console.log(`📝 Wrote ${envContent.length} lines to .env${existingEnvBackedUp ? ' (old file backed up)' : ''}`);
  console.log('🎉 Secrets pulled successfully!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  pullSecrets().catch(error => {
    console.error('❌ Failed to pull secrets:', error);
    process.exit(1);
  });
}

export { pullSecrets, SECRETS_TO_PULL }; 
