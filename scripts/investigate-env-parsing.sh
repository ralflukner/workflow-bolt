#!/opt/homebrew/bin/bash
# scripts/investigate-env-parsing.sh

set -e

echo "🔍 Investigating .env file structure..."
echo "======================================"
echo ""

# First, let's see what's actually in the .env file for these keys
echo "📄 Raw .env content for problem keys:"
echo "-------------------------------------"
for key in VITE_TEBRA_USERNAME VITE_TEBRA_PASSWORD VITE_TEBRA_WSDL_URL VITE_PATIENT_ENCRYPTION_KEY VITE_TEBRA_PROXY_API_KEY VITE_FIREBASE_CONFIG; do
    echo ""
    echo "🔍 $key:"
    grep -A 5 "^${key}=" .env || echo "NOT FOUND"
    echo "---"
done

echo ""
echo "📊 Let's check how many lines VITE_FIREBASE_CONFIG spans:"
awk '/^VITE_FIREBASE_CONFIG=/{flag=1} flag && /^[A-Z_]+=/{if(prev)exit} {if(flag)count++; prev=flag} END{print "Lines: " count}' .env

echo ""
echo "🔧 Creating a properly formatted .env file..."

# Create a new script to properly sync from GSM
cat > /tmp/create-clean-env.js << 'EOF'
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const fs = require('fs');

async function createCleanEnv() {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

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

    const envLines = [];

    for (const secretName of secrets) {
        try {
            const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
            const [version] = await client.accessSecretVersion({ name });
            const value = version.payload.data.toString('utf8');

            // For multiline values (like JSON or private keys), we need to properly escape them
            if (value.includes('\n') || value.includes('"')) {
                // For private keys and JSON, wrap in quotes and escape
                const escaped = value
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n');
                envLines.push(`${secretName}="${escaped}"`);
            } else {
                envLines.push(`${secretName}=${value}`);
            }

            console.log(`✅ ${secretName}`);
        } catch (error) {
            console.log(`❌ ${secretName}: ${error.message}`);
        }
    }

    // Write to .env.clean
    fs.writeFileSync('.env.clean', envLines.join('\n') + '\n');
    console.log('\n✅ Created .env.clean with properly formatted values');
}

createCleanEnv().catch(console.error);
EOF

echo "📝 Creating clean .env file from GSM..."
node /tmp/create-clean-env.js

echo ""
echo "🔄 Backing up current .env and replacing with clean version..."
cp .env .env.backup.parsing-issue
mv .env.clean .env

echo ""
echo "✅ Replaced .env with properly formatted version"
echo ""
echo "🧪 Running consistency check..."
node scripts/check-env-gsm-consistency.js | tail -n 25

# Clean up
rm -f /tmp/create-clean-env.js