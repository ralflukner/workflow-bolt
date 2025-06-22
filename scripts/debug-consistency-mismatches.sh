#!/opt/homebrew/bin/bash
# scripts/debug-consistency-mismatches.sh

set -e

echo "🔍 Debugging consistency mismatches..."
echo "===================================="
echo ""

# Function to show detailed comparison
debug_secret() {
    local env_key="$1"

    echo "📝 Debugging $env_key:"
    echo "-------------------"

    # Get value from .env
    local env_value
    if grep -q "^${env_key}=" .env; then
        env_value=$(grep "^${env_key}=" .env | cut -d'=' -f2-)
        # Remove quotes if present
        if [[ "$env_value" =~ ^\".*\"$ ]]; then
            env_value="${env_value:1:-1}"
            # Unescape the value
            env_value=$(echo -e "$env_value")
        fi
    else
        env_value="NOT_FOUND"
    fi

    # Get value from GSM
    local gsm_value
    gsm_value=$(gcloud secrets versions access latest --secret="$env_key" 2>/dev/null || echo "NOT_FOUND")

    echo "ENV length: ${#env_value}"
    echo "GSM length: ${#gsm_value}"

    # Show first 50 chars with visible whitespace
    echo "ENV preview: '${env_value:0:50}'"
    echo "GSM preview: '${gsm_value:0:50}'"

    # Check for common issues
    if [ "$env_value" = "$gsm_value" ]; then
        echo "✅ Values are identical"
    else
        echo "❌ Values differ"

        # Check for trailing whitespace
        local env_trimmed="${env_value%"${env_value##*[![:space:]]}"}"
        local gsm_trimmed="${gsm_value%"${gsm_value##*[![:space:]]}"}"

        if [ "$env_trimmed" = "$gsm_trimmed" ]; then
            echo "   Issue: Trailing whitespace difference"
        fi

        # Check if one has quotes and other doesn't
        if [[ "\"$gsm_value\"" = "$env_value" ]] || [[ "$gsm_value" = "\"$env_value\"" ]]; then
            echo "   Issue: Quote wrapping difference"
        fi

        # For multiline values, check line endings
        if [[ "$env_value" == *$'\n'* ]] || [[ "$gsm_value" == *$'\n'* ]]; then
            echo "   Issue: Contains newlines - possible escaping issue"

            # Show hex dump of first 100 bytes
            echo "   ENV hex (first 100 bytes):"
            echo -n "$env_value" | head -c 100 | od -An -tx1 | head -n 2
            echo "   GSM hex (first 100 bytes):"
            echo -n "$gsm_value" | head -c 100 | od -An -tx1 | head -n 2
        fi
    fi

    echo ""
}

# Debug the mismatched secrets
debug_secret "VITE_TEBRA_USERNAME"
debug_secret "VITE_TEBRA_PASSWORD"
debug_secret "VITE_TEBRA_WSDL_URL"
debug_secret "VITE_PATIENT_ENCRYPTION_KEY"
debug_secret "VITE_TEBRA_PROXY_API_KEY"
debug_secret "VITE_FIREBASE_CONFIG"

echo "🔧 Let's check how the consistency script reads these values..."
echo ""

# Run a Node.js debug script
cat > /tmp/debug-consistency.js << 'EOF'
const fs = require('fs');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const dotenv = require('dotenv');

async function debug() {
    // Read .env
    const envConfig = dotenv.parse(fs.readFileSync('.env'));

    // Initialize GSM client
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

    const keysToCheck = [
        'VITE_TEBRA_USERNAME',
        'VITE_TEBRA_PASSWORD',
        'VITE_TEBRA_WSDL_URL',
        'VITE_PATIENT_ENCRYPTION_KEY',
        'VITE_TEBRA_PROXY_API_KEY',
        'VITE_FIREBASE_CONFIG'
    ];

    for (const key of keysToCheck) {
        console.log(`\n📝 ${key}:`);

        const envValue = envConfig[key] || '';

        try {
            const name = `projects/${projectId}/secrets/${key}/versions/latest`;
            const [version] = await client.accessSecretVersion({ name });
            const gsmValue = version.payload.data.toString('utf8');

            console.log(`  ENV type: ${typeof envValue}`);
            console.log(`  GSM type: ${typeof gsmValue}`);
            console.log(`  ENV length: ${envValue.length}`);
            console.log(`  GSM length: ${gsmValue.length}`);

            if (envValue === gsmValue) {
                console.log(`  ✅ Exact match`);
            } else {
                console.log(`  ❌ Mismatch`);

                // Find first difference
                for (let i = 0; i < Math.min(envValue.length, gsmValue.length); i++) {
                    if (envValue[i] !== gsmValue[i]) {
                        console.log(`  First diff at position ${i}:`);
                        console.log(`    ENV char: '${envValue[i]}' (code: ${envValue.charCodeAt(i)})`);
                        console.log(`    GSM char: '${gsmValue[i]}' (code: ${gsmValue.charCodeAt(i)})`);
                        break;
                    }
                }

                // Check if it's just length
                if (envValue.length !== gsmValue.length) {
                    const diff = Math.abs(envValue.length - gsmValue.length);
                    console.log(`  Length difference: ${diff} chars`);
                    if (envValue.length > gsmValue.length) {
                        console.log(`  ENV has extra: '${envValue.slice(gsmValue.length)}'`);
                    } else {
                        console.log(`  GSM has extra: '${gsmValue.slice(envValue.length)}'`);
                    }
                }
            }
        } catch (error) {
            console.log(`  Error reading from GSM: ${error.message}`);
        }
    }
}

debug().catch(console.error);
EOF

node /tmp/debug-consistency.js