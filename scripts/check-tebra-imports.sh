#!/opt/homebrew/bin/bash
# scripts/check-tebra-imports.sh

set -e

echo "🔍 Checking TebraIntegration component imports..."
echo "=============================================="
echo ""

# Find the TebraIntegration component
echo "📄 Looking for TebraIntegration component..."
find src -name "TebraIntegration.tsx" -o -name "TebraIntegration.ts" | head -5

echo ""
echo "📝 Checking imports in TebraIntegration..."
if [ -f "src/components/TebraIntegration.tsx" ]; then
    grep -E "import.*from.*tebra" src/components/TebraIntegration.tsx || echo "No tebra imports found"
fi

echo ""
echo "🔍 Looking for tebra service files..."
find src -name "*tebra*" -type f | grep -E "\.(ts|tsx)$" | grep -v "__tests__" | grep -v ".test." | head -10

echo ""
echo "📋 Restoring original test and checking its imports..."
if [ -f "src/components/__tests__/TebraIntegration.test.tsx.backup" ]; then
    cp src/components/__tests__/TebraIntegration.test.tsx.backup src/components/__tests__/TebraIntegration.test.tsx
    echo "✅ Restored original test file"

    echo ""
    echo "Original imports:"
    grep -E "^import" src/components/__tests__/TebraIntegration.test.tsx | head -10
fi