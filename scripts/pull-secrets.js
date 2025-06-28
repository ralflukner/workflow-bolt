#!/usr/bin/env node

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------
// Configuration
// -------------------------

// Resolve project ID (arg ▸ env ▸ gcloud default)
let PROJECT_ID = process.argv[2] || process.env.GOOGLE_CLOUD_PROJECT;
if (!PROJECT_ID) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = await import('child_process');
    PROJECT_ID = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
  } catch {
    // ignore – handled below
  }
}

if (!PROJECT_ID) {
  console.error('❌ PROJECT_ID not specified. Pass it as CLI arg, set GOOGLE_CLOUD_PROJECT env var, or run "gcloud config set project".');
  process.exit(1);
}

const SECRETS_TO_PULL = [
  // Auth0 secrets
  { name: 'AUTH0_DOMAIN', envVar: 'VITE_AUTH0_DOMAIN' },
  { name: 'AUTH0_CLIENT_ID', envVar: 'VITE_AUTH0_CLIENT_ID' },
  { name: 'AUTH0_REDIRECT_URI', envVar: 'VITE_AUTH0_REDIRECT_URI' },
  { name: 'AUTH0_AUDIENCE', envVar: 'VITE_AUTH0_AUDIENCE' },
  { name: 'AUTH0_SCOPE', envVar: 'VITE_AUTH0_SCOPE' },
  // Patient Encryption
  { name: 'REACT_APP_PATIENT_ENCRYPTION_KEY', envVar: 'VITE_PATIENT_ENCRYPTION_KEY' },
  // Tebra / Gmail (legacy naming)
  { name: 'TEBRA_CLIENT_ID', envVar: 'GMAIL_CLIENT_ID' },
  { name: 'TEBRA_CLIENT_SECRET', envVar: 'GMAIL_CLIENT_SECRET' },
  { name: 'TEBRA_INTERNAL_API_KEY', envVar: 'TEBRA_INTERNAL_API_KEY' },
  { name: 'TEBRA_REDIRECT_URI', envVar: 'VITE_TEBRA_REDIRECT_URI' },
  { name: 'TEBRA_CLOUD_RUN_URL', envVar: 'TEBRA_CLOUD_RUN_URL' },
  { name: 'TEBRA_USERNAME', envVar: 'VITE_TEBRA_USERNAME' },
  { name: 'TEBRA_PASSWORD', envVar: 'VITE_TEBRA_PASSWORD' },
  { name: 'TEBRA_CUSTOMER_KEY', envVar: 'VITE_TEBRA_CUSTOMER_KEY' },
  { name: 'TEBRA_WSDL_URL', envVar: 'VITE_TEBRA_WSDL_URL' },
  // Gmail OAuth2 secrets
  { name: 'GMAIL_CLIENT_ID', envVar: 'GMAIL_CLIENT_ID' },
  { name: 'GMAIL_CLIENT_SECRET', envVar: 'GMAIL_CLIENT_SECRET' },
  { name: 'GMAIL_REFRESH_TOKEN', envVar: 'GMAIL_REFRESH_TOKEN' },
  { name: 'GMAIL_OAUTH_CLIENT_ID', envVar: 'GMAIL_OAUTH_CLIENT_ID' },
  { name: 'GMAIL_OAUTH_CLIENT_SECRET', envVar: 'GMAIL_OAUTH_CLIENT_SECRET' },
  // Gmail Service Account secrets (for Domain-Wide Delegation)
  { name: 'GMAIL_SERVICE_ACCOUNT_EMAIL', envVar: 'GMAIL_SERVICE_ACCOUNT_EMAIL' },
  { name: 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY', envVar: 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY' },
  // Runtime configuration / proxy
  { name: 'VITE_TEBRA_PROXY_API_KEY', envVar: 'VITE_TEBRA_PROXY_API_KEY' },
  { name: 'VITE_FIREBASE_CONFIG', envVar: 'VITE_FIREBASE_CONFIG' },
  { name: 'GOOGLE_CLOUD_PROJECT', envVar: 'GOOGLE_CLOUD_PROJECT' },
  // Misc
  { name: 'GOOGLE_APPLICATION_CREDENTIALS', envVar: 'GOOGLE_APPLICATION_CREDENTIALS' },
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

export { pullSecrets, SECRETS_TO_PULL }; 
