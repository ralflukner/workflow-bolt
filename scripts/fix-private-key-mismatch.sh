#!/opt/homebrew/bin/bash
# scripts/fix-private-key-final.sh

set -e

echo "🔧 Final fix for GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY..."
echo "===================================================="
echo ""

# Get the exact value from GSM
echo "📥 Getting exact value from GSM..."
gcloud secrets versions access latest --secret=GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY > /tmp/gsm_key_raw.txt

# Create a simple Python script to update just this one key
cat > /tmp/fix_key.py << 'PYTHON_EOF'
import re

# Read GSM value
with open('/tmp/gsm_key_raw.txt', 'r') as f:
    gsm_value = f.read().rstrip('\n')  # Remove trailing newline if any

print(f"GSM value length: {len(gsm_value)}")
print(f"First 60 chars: {gsm_value[:60]}...")
print(f"Already has \\\\n: {'\\\\n' in gsm_value}")

# Read current .env
with open('.env', 'r') as f:
    lines = f.readlines()

# Find and replace the line
new_lines = []
found = False
for line in lines:
    if line.startswith('GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY='):
        # Replace with exact GSM value, wrapped in quotes
        new_lines.append(f'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY="{gsm_value}"\n')
        found = True
        print("✅ Replaced existing line")
    else:
        new_lines.append(line)

if not found:
    # Add if not found
    new_lines.append(f'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY="{gsm_value}"\n')
    print("✅ Added new line")

# Write back
with open('.env', 'w') as f:
    f.writelines(new_lines)

print("✅ Updated .env file")
PYTHON_EOF

# Run the fix
python3 /tmp/fix_key.py

# Clean up
rm -f /tmp/fix_key.py /tmp/gsm_key_raw.txt

echo ""
echo "🧪 Running consistency check..."
node scripts/check-env-gsm-consistency.js | grep -A1 -B1 "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY"

echo ""
echo "📊 Full consistency check:"
node scripts/check-env-gsm-consistency.js | tail -10