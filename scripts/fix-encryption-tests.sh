#!/opt/homebrew/bin/bash
# scripts/fix-encryption-tests.sh

set -e

echo "🔧 Fixing encryption tests..."
echo "============================"
echo ""

# First, let's check if the test setup file exists
if [ -f "src/setupTests.ts" ]; then
    echo "📄 Found setupTests.ts"

    # Add dotenv config to the setup file
    cat > /tmp/setup-patch.ts << 'TS_EOF'
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for tests
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

TS_EOF

    # Prepend to existing setup file
    cat /tmp/setup-patch.ts src/setupTests.ts > /tmp/new-setup.ts
    mv /tmp/new-setup.ts src/setupTests.ts
    rm /tmp/setup-patch.ts

    echo "✅ Updated setupTests.ts to load .env"
else
    # Create a new setup file
    cat > src/setupTests.ts << 'TS_EOF'
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for tests
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
TS_EOF

    echo "✅ Created setupTests.ts to load .env"
fi

# Update jest config to use the setup file
echo ""
echo "📝 Updating Jest configuration..."

# Check which jest config file exists
if [ -f "jest.config.js" ]; then
    CONFIG_FILE="jest.config.js"
elif [ -f "jest.config.ts" ]; then
    CONFIG_FILE="jest.config.ts"
elif [ -f "jest.config.json" ]; then
    CONFIG_FILE="jest.config.json"
else
    # Check package.json for jest config
    CONFIG_FILE="package.json"
fi

echo "   Found config in: $CONFIG_FILE"

# Alternative approach: Set the env var directly in the test file
echo ""
echo "🔨 Also updating the test file directly..."

cat > /tmp/test-fix.ts << 'TS_EOF'
// Add at the top of the test file
import dotenv from 'dotenv';
dotenv.config();

// Or mock the environment variable for tests
beforeAll(() => {
  if (!process.env.VITE_PATIENT_ENCRYPTION_KEY) {
    process.env.VITE_PATIENT_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
  }
});
TS_EOF

# Update the test file
if [ -f "src/services/encryption/__tests__/patientEncryptionService.test.ts" ]; then
    # Create a backup
    cp src/services/encryption/__tests__/patientEncryptionService.test.ts \
       src/services/encryption/__tests__/patientEncryptionService.test.ts.backup

    # Add the fix at the beginning of the file
    cat /tmp/test-fix.ts > /tmp/updated-test.ts
    echo "" >> /tmp/updated-test.ts
    cat src/services/encryption/__tests__/patientEncryptionService.test.ts >> /tmp/updated-test.ts
    mv /tmp/updated-test.ts src/services/encryption/__tests__/patientEncryptionService.test.ts

    echo "✅ Updated test file with environment setup"
fi

# Clean up
rm -f /tmp/test-fix.ts

echo ""
echo "🧪 Running the encryption tests again..."
npm test -- src/services/encryption/__tests__/patientEncryptionService.test.ts