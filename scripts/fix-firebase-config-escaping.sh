#!/opt/homebrew/bin/bash
# scripts/fix-firebase-config-escaping.sh

set -e

echo "🔧 Fixing VITE_FIREBASE_CONFIG escaping issue..."
echo "=============================================="
echo ""

# Get the value from GSM (which has the correct unescaped format)
echo "📥 Getting correct value from GSM..."
GSM_VALUE=$(gcloud secrets versions access latest --secret="VITE_FIREBASE_CONFIG")

echo "📝 GSM value preview:"
echo "$GSM_VALUE" | head -n 3
echo "..."

# Create a temporary Python script to properly update .env
cat > /tmp/fix_firebase_config.py << 'EOF'
import sys
import os

# Read the Firebase config from stdin
firebase_config = sys.stdin.read().strip()

# Read the current .env file
with open('.env', 'r') as f:
    lines = f.readlines()

# Update the VITE_FIREBASE_CONFIG line
new_lines = []
inside_firebase_config = False
skip_next = False

for i, line in enumerate(lines):
    if skip_next:
        skip_next = False
        continue

    if line.startswith('VITE_FIREBASE_CONFIG='):
        # Add the new value directly without escaping
        new_lines.append(f'VITE_FIREBASE_CONFIG={firebase_config}\n')

        # Skip any continuation lines (if the JSON was split across multiple lines)
        j = i + 1
        while j < len(lines) and not '=' in lines[j]:
            skip_next = True
            j += 1
    else:
        new_lines.append(line)

# Write back to .env
with open('.env', 'w') as f:
    f.writelines(new_lines)

print("✅ Updated VITE_FIREBASE_CONFIG in .env")
EOF

# Pass the GSM value to the Python script
echo "$GSM_VALUE" | python3 /tmp/fix_firebase_config.py

# Clean up
rm -f /tmp/fix_firebase_config.py

echo ""
echo "🔍 Verifying the fix..."
echo ""

# Check the specific value
echo "📊 Checking VITE_FIREBASE_CONFIG consistency:"
python3 -c "
import os
import subprocess

# Get value from .env
env_value = None
with open('.env', 'r') as f:
    in_firebase_config = False
    for line in f:
        if line.startswith('VITE_FIREBASE_CONFIG='):
            env_value = line.split('=', 1)[1].strip()
            break

# Get value from GSM
gsm_value = subprocess.check_output(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=VITE_FIREBASE_CONFIG'], text=True).strip()

print(f'ENV length: {len(env_value)}')
print(f'GSM length: {len(gsm_value)}')

if env_value == gsm_value:
    print('✅ Values now match!')
else:
    print('❌ Still different')
    # Find first difference
    for i, (e, g) in enumerate(zip(env_value, gsm_value)):
        if e != g:
            print(f'First difference at position {i}:')
            print(f'  ENV: {repr(e)}')
            print(f'  GSM: {repr(g)}')
            break
"

echo ""
echo "🧪 Running full consistency check..."
node scripts/check-env-gsm-consistency.js | grep -E "(VITE_TEBRA_USERNAME|VITE_TEBRA_PASSWORD|VITE_TEBRA_WSDL_URL|VITE_PATIENT_ENCRYPTION_KEY|VITE_TEBRA_PROXY_API_KEY|VITE_FIREBASE_CONFIG|Summary)"

echo ""
echo "💡 If other values still show as mismatched, it might be the consistency script itself."
echo "   The bash debug showed all values except FIREBASE_CONFIG were identical."