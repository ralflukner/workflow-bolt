#!/opt/homebrew/bin/bash
# scripts/debug-private-key-in-project.sh

set -e

echo "🔍 Debugging GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY comparison..."
echo "=========================================================="
echo ""

# Create debug script in project directory
cat > debug-private-key.mjs << 'JS_EOF'
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
  console.log(`  Contains \\\\n string: ${envValue.includes('\\n')}`);
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
  console.log(`  Contains \\\\n string: ${parsedValue.includes('\\n')}`);
  console.log(`  Contains actual newline: ${parsedValue.includes('\n')}`);
}

// Get GSM value
console.log('\n📊 GSM value analysis:');
try {
  const gsmValue = execSync('gcloud secrets versions access latest --secret=GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY', { encoding: 'utf8' });
  console.log(`  Length: ${gsmValue.length}`);
  console.log(`  First 60 chars: ${gsmValue.substring(0, 60)}...`);
  console.log(`  Contains \\\\n string: ${gsmValue.includes('\\n')}`);
  console.log(`  Contains actual newline: ${gsmValue.includes('\n')}`);

  // Compare
  console.log('\n🔍 Comparison:');
  console.log(`  process.env value === GSM value: ${envValue === gsmValue}`);
  console.log(`  parsed .env value === GSM value: ${parsedValue === gsmValue}`);

  // Show the actual line in .env
  console.log('\n📄 Raw .env line:');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=')) {
      console.log(`  Length: ${line.length}`);
      console.log(`  First 100 chars: ${line.substring(0, 100)}...`);
      console.log(`  Has quotes: ${line.includes('"')}`);
      break;
    }
  }

} catch (error) {
  console.log(`  Error getting GSM value: ${error.message}`);
}
JS_EOF

# Run the debug script
node debug-private-key.mjs

# Clean up
rm -f debug-private-key.mjs

echo ""
echo "🔧 Let's try a simpler approach - use the pull-secrets script!"
echo ""

# Just use the existing pull-secrets script for this one key
node scripts/pull-secrets.js | grep -A2 -B2 "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY"

echo ""
echo "🧪 Final check:"
node scripts/check-env-gsm-consistency.js | grep -A1 -B1 "GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY"