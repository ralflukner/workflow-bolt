#!/opt/homebrew/bin/bash
# scripts/fix-remaining-mismatches.sh

set -e

echo "🔧 Fixing remaining mismatches..."
echo "================================"
echo ""

# Backup current .env
cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"

# Create a Python script to update specific values
cat > /tmp/update_env_values.py << 'PYTHON_EOF'
import subprocess
import re
import sys

def get_gsm_value(secret_name):
    """Get value from Google Secret Manager"""
    try:
        result = subprocess.run(
            ['gcloud', 'secrets', 'versions', 'access', 'latest', f'--secret={secret_name}'],
            capture_output=True, text=True, check=True
        )
        return result.stdout
    except:
        return None

def update_env_file():
    # Read current .env
    with open('.env', 'r') as f:
        content = f.read()

    # Keys to update
    updates = {
        'VITE_TEBRA_PASSWORD': get_gsm_value('VITE_TEBRA_PASSWORD'),
        'VITE_TEBRA_PROXY_API_KEY': get_gsm_value('VITE_TEBRA_PROXY_API_KEY'),
        'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY': get_gsm_value('GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY')
    }

    print("📥 Fetching values from GSM:")
    for key, value in updates.items():
        if value:
            # Remove any trailing newlines from GSM
            value = value.rstrip('\n')

            if key == 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY':
                # Special handling for private key
                # Escape the private key for .env format
                escaped_value = value.replace('\\', '\\\\')  # Escape backslashes
                escaped_value = escaped_value.replace('"', '\\"')  # Escape quotes
                escaped_value = escaped_value.replace('\n', '\\n')  # Convert newlines to \n
                new_line = f'{key}="{escaped_value}"'
                print(f"  ✅ {key}: Found (multiline JSON key)")
            else:
                # Simple values
                new_line = f'{key}={value}'
                print(f"  ✅ {key}: {value}")

            # Replace in content
            # Use a regex that handles both quoted and unquoted values
            pattern = rf'^{re.escape(key)}=.*$'
            if re.search(pattern, content, re.MULTILINE):
                content = re.sub(pattern, new_line, content, flags=re.MULTILINE)
            else:
                # Add if not present
                content += f'\n{new_line}'
        else:
            print(f"  ❌ {key}: Not found in GSM")

    # Write back
    with open('.env', 'w') as f:
        f.write(content)

    print("\n✅ Updated .env file with GSM values")

if __name__ == "__main__":
    update_env_file()
PYTHON_EOF

# Run the update script
python3 /tmp/update_env_values.py

# Clean up
rm -f /tmp/update_env_values.py

echo ""
echo "🧪 Running consistency check..."
node scripts/check-env-gsm-consistency.js | tail -25

echo ""
echo "💡 If mismatches persist, let's check the exact differences:"
echo ""

# Create a detailed comparison script
cat > /tmp/compare_values.mjs << 'JS_EOF'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import dotenv from 'dotenv';

const client = new SecretManagerServiceClient();
const projectId = 'luknerlumina-firebase';

// Parse .env
const envConfig = dotenv.parse(fs.readFileSync('.env', 'utf8'));

// Keys to check
const keys = ['VITE_TEBRA_PASSWORD', 'VITE_TEBRA_PROXY_API_KEY', 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY'];

console.log('\n📊 Detailed comparison:');
console.log('=====================');

for (const key of keys) {
    console.log(`\n${key}:`);

    const envValue = envConfig[key] || '';

    try {
        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${key}/versions/latest`
        });
        const gsmValue = version.payload.data.toString('utf8');

        if (envValue === gsmValue) {
            console.log('  ✅ Values match exactly');
        } else {
            console.log('  ❌ Values differ:');
            console.log(`    ENV length: ${envValue.length}`);
            console.log(`    GSM length: ${gsmValue.length}`);

            if (key === 'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY') {
                // For private key, just show lengths
                console.log('    (Private key content hidden for security)');
            } else {
                console.log(`    ENV: '${envValue}'`);
                console.log(`    GSM: '${gsmValue}'`);
            }
        }
    } catch (error) {
        console.log(`  ❌ Error accessing GSM: ${error.message}`);
    }
}
JS_EOF

node /tmp/compare_values.mjs
rm -f /tmp/compare_values.mjs