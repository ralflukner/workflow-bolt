#!/opt/homebrew/bin/bash
# scripts/fix-consistency-checker.sh

set -e

echo "🔧 Fixing the consistency checker to handle private keys correctly..."
echo "=================================================================="
echo ""

# Backup the original
cp scripts/check-env-gsm-consistency.js scripts/check-env-gsm-consistency.js.backup

# Create a patch for the consistency checker
cat > /tmp/patch-consistency-checker.js << 'JS_EOF'
const fs = require('fs');

// Read the original file
const content = fs.readFileSync('scripts/check-env-gsm-consistency.js', 'utf8');

// Find where it compares values and add special handling for GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY
const newContent = content.replace(
  /(const gsmValue = payload\.data\.toString\('utf8'\);)/,
  `$1

      // Special handling for GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY
      if (secret === 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY') {
        // GSM stores with \\\\n, but .env has actual newlines
        // Convert GSM value to match .env format
        const gsmUnescaped = gsmValue.replace(/\\\\n/g, '\\n');
        if (envValue === gsmUnescaped) {
          console.log(\`✅ \${secret} is consistent\`);
          continue;
        }
      }`
);

// Write the updated file
fs.writeFileSync('scripts/check-env-gsm-consistency.js', newContent);

console.log('✅ Updated consistency checker');
JS_EOF

# Apply the patch
node /tmp/patch-consistency-checker.js
rm -f /tmp/patch-consistency-checker.js

echo ""
echo "🧪 Testing the updated consistency checker..."
node scripts/check-env-gsm-consistency.js | tail -10

echo ""
echo "💡 If it's still not working, let's try a different approach..."

# Alternative fix - update the consistency checker more carefully
cat > scripts/check-env-gsm-consistency-v2.js << 'JS_EOF'
#!/usr/bin/env node
require('dotenv').config({ override: false });
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function checkConsistency() {
  const client = new SecretManagerServiceClient();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

  console.log('\n🔍 Checking consistency between .env and Google Secret Manager');
  console.log(`   Google Cloud project: ${projectId}\n`);

  const secrets = [
    'VITE_AUTH0_DOMAIN',
    'VITE_AUTH0_CLIENT_ID',
    'VITE_AUTH0_REDIRECT_URI',
    'VITE_AUTH0_AUDIENCE',
    'VITE_AUTH0_SCOPE',
    'VITE_TEBRA_USERNAME',
    'VITE_TEBRA_PASSWORD',
    'VITE_TEBRA_CUSTOMER_KEY',
    'VITE_TEBRA_WSDL_URL',
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
    'GMAIL_OAUTH_CLIENT_ID',
    'GMAIL_OAUTH_CLIENT_SECRET',
    'GMAIL_SERVICE_ACCOUNT_EMAIL',
    'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY',
    'VITE_PATIENT_ENCRYPTION_KEY',
    'VITE_TEBRA_PROXY_API_KEY',
    'VITE_FIREBASE_CONFIG',
    'GOOGLE_CLOUD_PROJECT'
  ];

  let mismatches = 0;
  let missing = 0;

  for (const secret of secrets) {
    const envValue = process.env[secret];

    if (!envValue) {
      console.log(`❌ ${secret} is missing from .env`);
      missing++;
      continue;
    }

    try {
      const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/${secret}/versions/latest`,
      });

      const payload = version.payload;
      const gsmValue = payload.data.toString('utf8');

      let isConsistent = false;

      // Special handling for GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY
      if (secret === 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY') {
        // GSM has \\n, .env has actual newlines
        const gsmUnescaped = gsmValue.replace(/\\n/g, '\n');
        isConsistent = (envValue === gsmUnescaped);
      } else {
        isConsistent = (envValue === gsmValue);
      }

      if (isConsistent) {
        console.log(`✅ ${secret} is consistent`);
      } else {
        console.log(`⚠️  ${secret} differs between .env and GSM`);
        mismatches++;
      }
    } catch (error) {
      console.log(`❌ ${secret} - Error accessing GSM: ${error.message}`);
      mismatches++;
    }
  }

  console.log('\nSummary:');
  console.log(`  Mismatched values: ${mismatches}`);
  console.log(`  Missing values:    ${missing}`);

  if (mismatches === 0 && missing === 0) {
    console.log('\n✅ Environment and GSM are in sync!');
    process.exit(0);
  } else {
    console.log('\n❌ Environment and GSM are NOT in sync.');
    process.exit(1);
  }
}

checkConsistency().catch(console.error);
JS_EOF

chmod +x scripts/check-env-gsm-consistency-v2.js

echo ""
echo "🧪 Testing the new version..."
node scripts/check-env-gsm-consistency-v2.js | tail -10