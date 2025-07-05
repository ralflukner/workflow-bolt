#!/bin/bash

echo "🔍 Fixing final TypeScript error..."

# Fix all diagnostic components to use HOC without generics
for file in src/components/*Diagnostic*.tsx; do
  if grep -q "export.*withContexts<" "$file"; then
    echo "Fixing $file..."
    sed -i '' 's/export default withContexts<[^>]*>(\([^)]*\));/export default withContexts(\1);/' "$file"
  fi
done

# Also check DiagnosticPanel and WaitTimeDiagnostic
for comp in DiagnosticPanel WaitTimeDiagnostic; do
  file="src/components/${comp}.tsx"
  if [ -f "$file" ] && grep -q "export.*withContexts<" "$file"; then
    echo "Fixing $file..."
    sed -i '' 's/export.*withContexts<[^>]*>(\([^)]*\));/export const '"$comp"' = withContexts(\1);/' "$file"
  fi
done

echo "✅ HOC exports fixed!"

# Test the build
echo "🧪 Testing build..."
npm run build
