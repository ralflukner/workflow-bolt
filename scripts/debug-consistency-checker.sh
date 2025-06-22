#!/opt/homebrew/bin/bash
# scripts/debug-consistency-checker.sh

set -e

echo "🔍 Debugging the consistency checker itself..."
echo "==========================================="
echo ""

# Let's look at the check-env-gsm-consistency.js script
echo "📄 Examining the consistency checker logic..."
grep -A 10 -B 5 "differs between" scripts/check-env-gsm-consistency.js || echo "Pattern not found"

echo ""
echo "🔧 Let's create a debug version of the consistency checker..."

# Create a debug version that shows what it's comparing
cat > scripts/debug-consistency-checker.js << 'EOF'
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const fs = require('fs');
const path = require('path');

async function checkConsistency() {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

    // Read .env file
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Parse .env file
    const envVars = {};
    envContent.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                const value = line.substring(equalIndex + 1);
                envVars[key] = value;
            }
        }
    });

    // Keys to debug
    const debugKeys = ['VITE_TEBRA_PASSWORD', 'VITE_TEBRA_WSDL_URL', 'VITE_TEBRA_PROXY_API_KEY'];

    for (const key of debugKeys) {
        console.log(`\n🔍 Debugging ${key}:`);

        const envValue = envVars[key] || '';
        console.log(`  ENV value: '${envValue}'`);
        console.log(`  ENV length: ${envValue.length}`);
        console.log(`  ENV type: ${typeof envValue}`);

        try {
            const name = `projects/${projectId}/secrets/${key}/versions/latest`;
            const [version] = await client.accessSecretVersion({ name });
            const gsmValue = version.payload.data.toString('utf8');

            console.log(`  GSM value: '${gsmValue}'`);
            console.log(`  GSM length: ${gsmValue.length}`);
            console.log(`  GSM type: ${typeof gsmValue}`);

            // Try different comparison methods
            console.log(`  Direct comparison (===): ${envValue === gsmValue}`);
            console.log(`  Trimmed comparison: ${envValue.trim() === gsmValue.trim()}`);

            // Character by character comparison
            if (envValue !== gsmValue) {
                const minLen = Math.min(envValue.length, gsmValue.length);
                for (let i = 0; i < minLen; i++) {
                    if (envValue[i] !== gsmValue[i]) {
                        console.log(`  First diff at position ${i}:`);
                        console.log(`    ENV: '${envValue[i]}' (code: ${envValue.charCodeAt(i)})`);
                        console.log(`    GSM: '${gsmValue[i]}' (code: ${gsmValue.charCodeAt(i)})`);
                        break;
                    }
                }

                if (envValue.length !== gsmValue.length) {
                    console.log(`  Length mismatch: ENV ${envValue.length} vs GSM ${gsmValue.length}`);
                }
            }

        } catch (error) {
            console.log(`  Error accessing GSM: ${error.message}`);
        }
    }
}

checkConsistency().catch(console.error);
EOF

echo ""
echo "🧪 Running debug consistency checker..."
node scripts/debug-consistency-checker.js

echo ""
echo "💡 Let's also check if it's a dotenv parsing issue..."

# Test with dotenv
cat > /tmp/test-dotenv.js << 'EOF'
require('dotenv').config();

const keys = ['VITE_TEBRA_PASSWORD', 'VITE_TEBRA_WSDL_URL', 'VITE_TEBRA_PROXY_API_KEY'];

console.log('\n📊 Values as parsed by dotenv:');
keys.forEach(key => {
    const value = process.env[key];
    console.log(`${key}: '${value}' (length: ${value ? value.length : 0})`);
});
EOF

node /tmp/test-dotenv.js

# Clean up
rm -f /tmp/test-dotenv.js