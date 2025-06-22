#!/opt/homebrew/bin/bash
# scripts/debug-consistency-checker-esm.sh

set -e

echo "🔍 Looking at the actual consistency checker..."
echo "============================================="
echo ""

# First, let's examine the existing consistency checker
echo "📄 Checking how the existing script parses .env..."
grep -A 20 -B 5 "parse.*env" scripts/check-env-gsm-consistency.js || echo "Checking for dotenv usage..."
grep -A 5 -B 5 "dotenv" scripts/check-env-gsm-consistency.js || echo "No dotenv found"

echo ""
echo "🔧 Creating ES module debug version..."

# Create an ES module version
cat > scripts/debug-consistency-checker.mjs << 'SCRIPT_EOF'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugConsistency() {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'luknerlumina-firebase';

    // Read and parse .env file using dotenv
    const envPath = path.join(__dirname, '..', '.env');
    const envConfig = dotenv.parse(fs.readFileSync(envPath, 'utf8'));

    console.log('📊 Using dotenv.parse() to read .env file');

    // Keys to debug
    const debugKeys = ['VITE_TEBRA_PASSWORD', 'VITE_TEBRA_WSDL_URL', 'VITE_TEBRA_PROXY_API_KEY'];

    for (const key of debugKeys) {
        console.log(`\n🔍 Debugging ${key}:`);

        const envValue = envConfig[key] || '';
        console.log(`  ENV value: '${envValue}'`);
        console.log(`  ENV length: ${envValue.length}`);
        console.log(`  ENV first 10 chars hex:`, Buffer.from(envValue.substring(0, 10)).toString('hex'));

        try {
            const name = `projects/${projectId}/secrets/${key}/versions/latest`;
            const [version] = await client.accessSecretVersion({ name });
            const gsmValue = version.payload.data.toString('utf8');

            console.log(`  GSM value: '${gsmValue}'`);
            console.log(`  GSM length: ${gsmValue.length}`);
            console.log(`  GSM first 10 chars hex:`, Buffer.from(gsmValue.substring(0, 10)).toString('hex'));

            // Check equality
            console.log(`  Are they equal? ${envValue === gsmValue}`);

            if (envValue !== gsmValue) {
                // Check byte by byte
                const envBytes = Buffer.from(envValue);
                const gsmBytes = Buffer.from(gsmValue);

                console.log(`  ENV buffer length: ${envBytes.length}`);
                console.log(`  GSM buffer length: ${gsmBytes.length}`);

                // Find first difference
                for (let i = 0; i < Math.min(envBytes.length, gsmBytes.length); i++) {
                    if (envBytes[i] !== gsmBytes[i]) {
                        console.log(`  First byte difference at position ${i}:`);
                        console.log(`    ENV byte: 0x${envBytes[i].toString(16)} (${String.fromCharCode(envBytes[i])})`);
                        console.log(`    GSM byte: 0x${gsmBytes[i].toString(16)} (${String.fromCharCode(gsmBytes[i])})`);
                        break;
                    }
                }
            }

        } catch (error) {
            console.log(`  Error accessing GSM: ${error.message}`);
        }
    }

    console.log('\n📄 Raw .env file content for these keys:');
    const rawContent = fs.readFileSync(envPath, 'utf8');
    debugKeys.forEach(key => {
        const regex = new RegExp(`^${key}=(.*)$`, 'm');
        const match = rawContent.match(regex);
        if (match) {
            console.log(`${key} raw line: '${match[0]}'`);
            console.log(`  Value part: '${match[1]}'`);
            console.log(`  Value length: ${match[1].length}`);
        }
    });
}

debugConsistency().catch(console.error);
SCRIPT_EOF

echo ""
echo "🧪 Running ES module debug version..."
node scripts/debug-consistency-checker.mjs

echo ""
echo "💡 Let's check if the actual consistency script is using a different parsing method..."

# Look for how envConfig is populated in the actual script
echo ""
echo "📄 Checking the actual parsing in check-env-gsm-consistency.js:"
grep -A 10 "envConfig\[" scripts/check-env-gsm-consistency.js || echo "No envConfig found"
grep -A 10 "process.env" scripts/check-env-gsm-consistency.js || echo "No process.env found"

# Clean up
rm -f scripts/debug-consistency-checker.mjs