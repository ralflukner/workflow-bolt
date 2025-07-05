#!/bin/bash

echo "🔧 Fixing PersistenceDiagnostic export..."

# Check if the file exists
if [ ! -f "src/components/PersistenceDiagnostic.tsx" ]; then
    echo "❌ PersistenceDiagnostic.tsx not found!"
    exit 1
fi

# Backup the file
cp src/components/PersistenceDiagnostic.tsx src/components/PersistenceDiagnostic.tsx.backup

# Fix the export statement
# Replace any typed withContexts call with untyped one
sed -i '' 's/export default withContexts<[^>]*>(\(.*\));/export default withContexts(\1);/g' src/components/PersistenceDiagnostic.tsx
sed -i '' 's/export const PersistenceDiagnostic = withContexts<[^>]*>(\(.*\));/export const PersistenceDiagnostic = withContexts(\1);/g' src/components/PersistenceDiagnostic.tsx

# If it's a named export, change to default
if grep -q "export const PersistenceDiagnostic" src/components/PersistenceDiagnostic.tsx; then
    sed -i '' 's/export const PersistenceDiagnostic = withContexts/const PersistenceDiagnostic = withContexts/g' src/components/PersistenceDiagnostic.tsx
    echo "" >> src/components/PersistenceDiagnostic.tsx
    echo "export default PersistenceDiagnostic;" >> src/components/PersistenceDiagnostic.tsx
fi

echo "✅ Export fixed!"
