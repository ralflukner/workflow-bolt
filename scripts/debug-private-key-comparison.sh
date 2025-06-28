#!/opt/homebrew/bin/bash
# scripts/debug-private-key-comparison.sh

set -e

echo "🔍 Debugging GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY comparison..."
echo "=========================================================="
echo ""

# Create a debug script that mimics what the consistency checker does
cat > /tmp/debug_comparison.mjs << 'JS_EOF'
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load .env exactly like the consistency checker does
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

// Get value from process.env (what consistency checker uses)
const envValue = process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY;

console.log('📊 Environment value analysis:');
console.log(`  From process.env: ${envValue ? 'Present' : 'Not present'}`);
if (envValue) {
  console.log(`  Length: ${envValue.length}`);
  console.log(`  First 60 chars: ${envValue.substring(0, 60)}...`);
  console.log(`  Contains \\n: ${envValue.includes('\\n')}`);
  console.log(`  Contains actual newline: ${envValue.includes('\n')}`);
}

// Also check what dotenv.parse would give us
const envContent = fs.readFileSync(envPath, 'utf8');
const parsedEnv = dotenv.parse(envContent);
const parsedValue = parsedEnv.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY;

console.log('\n📊 Parsed .env value analysis:');
console.log(`  From dotenv.parse: ${parsedValue ? 'Present' : 'Not present'}`);
if (parsedValue) {
  console.log(`  Length: ${parsedValue.length}`);
  console.log(`  First 60 chars: ${parsedValue.substring(0, 60)}...`);
  console.log(`  Contains \\n: ${parsedValue.includes('\\n')}`);
  console.log(`  Contains actual newline: ${parsedValue.includes('\n')}`);
}

// Get GSM value
console.log('\n📊 GSM value analysis:');
try {
  const gsmValue = execSync('gcloud secrets versions access latest --secret=GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY', { encoding: 'utf8' }).trim();
  console.log(`  Length: ${gsmValue.length}`);
  console.log(`  First 60 chars: ${gsmValue.substring(0, 60)}...`);
  console.log(`  Contains \\n: ${gsmValue.includes('\\n')}`);
  console.log(`  Contains actual newline: ${gsmValue.includes('\n')}`);

  // Compare
  console.log('\n🔍 Comparison:');
  console.log(`  process.env value === GSM value: ${envValue === gsmValue}`);
  console.log(`  parsed .env value === GSM value: ${parsedValue === gsmValue}`);

  // If not equal, find difference
  if (parsedValue !== gsmValue) {
    console.log('\n  Finding first difference...');
    for (let i = 0; i < Math.min(parsedValue.length, gsmValue.length); i++) {
      if (parsedValue[i] !== gsmValue[i]) {
        console.log(`  First difference at position ${i}:`);
        console.log(`    .env char: '${parsedValue[i]}' (code: ${parsedValue.charCodeAt(i)})`);
        console.log(`    GSM char: '${gsmValue[i]}' (code: ${gsmValue.charCodeAt(i)})`);
        console.log(`    .env context: ...${parsedValue.substring(Math.max(0, i-10), i+10)}...`);
        console.log(`    GSM context: ...${gsmValue.substring(Math.max(0, i-10), i+10)}...`);
        break;
      }
    }
  }

} catch (error) {
  console.log(`  Error getting GSM value: ${error.message}`);
}

// Show the actual line in .env
console.log('\n📄 Raw .env line:');
const lines = envContent.split('\n');
for (const line of lines) {
  if (line.startsWith('GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=')) {
    console.log(`  ${line.substring(0, 100)}...`);
    break;
  }
}
JS_EOF

# Run the debug script
node /tmp/debug_comparison.mjs

# Clean up
rm -f /tmp/debug_comparison.mjs

echo ""
echo "💡 Based on the above, let's try a different approach..."
echo ""

# Now let's fix it based on what we learned
cat > /tmp/final_fix.py << 'PYTHON_EOF'
import subprocess
import re

# Get GSM value
result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY'],
                       capture_output=True, text=True)
gsm_value = result.stdout.rstrip('\n')

print(f"📥 GSM value retrieved, length: {len(gsm_value)}")

# The GSM value already has \\n (escaped newlines)
# We need to store it in .env in a way that when parsed by dotenv, it matches exactly

# Read .env
with open('.env', 'r') as f:
    content = f.read()

# Remove any existing GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY line
lines = content.split('\n')
new_lines = [line for line in lines if not line.startswith('GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=')]

# Add the new line
# Since GSM already has \\n, we need to escape the backslashes when writing to .env
# so that when dotenv parses it, it becomes \\n again (not actual newlines)
escaped_value = gsm_value.replace('\\', '\\\\')
new_lines.append(f'GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY={escaped_value}')

# Write back
with open('.env', 'w') as f:
    f.write('\n'.join(new_lines))

print("✅ Updated .env with properly escaped value")
PYTHON_EOF

python3 /tmp/final_fix.py
rm -f /tmp/final_fix.py

echo ""
echo "🧪 Final consistency check:"
node scripts/check-env-gsm-consistency.js | grep -A1 -B1 "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY"