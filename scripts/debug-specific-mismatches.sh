#!/opt/homebrew/bin/bash
# scripts/debug-specific-mismatches.sh

set -e

echo "🔍 Debugging specific mismatches..."
echo "=================================="
echo ""

# Check each problematic value
for KEY in VITE_TEBRA_PASSWORD VITE_TEBRA_WSDL_URL VITE_TEBRA_PROXY_API_KEY; do
    echo "📝 Checking $KEY:"
    echo "----------------"

    # Get from .env
    ENV_VALUE=$(grep "^${KEY}=" .env | cut -d'=' -f2-)
    echo "ENV value: '$ENV_VALUE'"
    echo "ENV length: ${#ENV_VALUE}"

    # Get from GSM
    GSM_VALUE=$(gcloud secrets versions access latest --secret="$KEY")
    echo "GSM value: '$GSM_VALUE'"
    echo "GSM length: ${#GSM_VALUE}"

    # Compare
    if [ "$ENV_VALUE" = "$GSM_VALUE" ]; then
        echo "✅ Bash comparison: MATCH"
    else
        echo "❌ Bash comparison: MISMATCH"

        # Check for invisible characters
        echo "Checking for invisible characters..."
        echo -n "ENV hex: "
        echo -n "$ENV_VALUE" | xxd -p | head -c 40
        echo ""
        echo -n "GSM hex: "
        echo -n "$GSM_VALUE" | xxd -p | head -c 40
        echo ""
    fi
    echo ""
done

echo "🔧 Let's check what the Node.js consistency checker sees..."
echo ""

# Create a minimal Node script to check these specific values
cat > /tmp/check-specific.js << 'EOF'
const fs = require('fs');

// Parse .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
            envVars[key.trim()] = valueParts.join('=');
        }
    }
});

// Check specific keys
const keys = ['VITE_TEBRA_PASSWORD', 'VITE_TEBRA_WSDL_URL', 'VITE_TEBRA_PROXY_API_KEY'];

keys.forEach(key => {
    console.log(`\n${key}:`);
    const value = envVars[key] || 'NOT_FOUND';
    console.log(`  Value: '${value}'`);
    console.log(`  Length: ${value.length}`);
    console.log(`  First 20 chars: '${value.substring(0, 20)}'`);
    console.log(`  Last 10 chars: '${value.substring(value.length - 10)}'`);
});
EOF

node /tmp/check-specific.js

# Clean up
rm -f /tmp/check-specific.js

echo ""
echo "💡 Possible issues:"
echo "1. The consistency checker might be trimming values"
echo "2. There might be trailing whitespace or newlines"
echo "3. The .env parser might be handling special characters differently"
echo ""

# Let's also update these specific values directly from GSM
echo "🔄 Re-syncing these specific values from GSM..."

# Create a Python script to carefully update just these values
cat > /tmp/fix_specific.py << 'EOF'
import subprocess
import re

# Read current .env
with open('.env', 'r') as f:
    lines = f.readlines()

# Keys to update
keys_to_update = ['VITE_TEBRA_PASSWORD', 'VITE_TEBRA_WSDL_URL', 'VITE_TEBRA_PROXY_API_KEY']

# Get values from GSM and update
for key in keys_to_update:
    try:
        # Get value from GSM
        result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', f'--secret={key}'],
                              capture_output=True, text=True)
        if result.returncode == 0:
            gsm_value = result.stdout.strip()  # Remove any trailing whitespace

            # Update in lines
            updated = False
            for i, line in enumerate(lines):
                if line.startswith(f'{key}='):
                    lines[i] = f'{key}={gsm_value}\n'
                    updated = True
                    print(f'✅ Updated {key}')
                    break

            if not updated:
                print(f'⚠️  {key} not found in .env')
    except Exception as e:
        print(f'❌ Error updating {key}: {e}')

# Write back
with open('.env', 'w') as f:
    f.writelines(lines)

print('\n✅ Specific values updated from GSM')
EOF

python3 /tmp/fix_specific.py
rm -f /tmp/fix_specific.py

echo ""
echo "🧪 Running consistency check again..."
node scripts/check-env-gsm-consistency.js | grep -E "(VITE_TEBRA_PASSWORD|VITE_TEBRA_WSDL_URL|VITE_TEBRA_PROXY_API_KEY|Summary)" | head -20
