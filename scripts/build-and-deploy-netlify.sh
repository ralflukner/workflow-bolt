#!/opt/homebrew/bin/bash
set -euo pipefail

# Always operate from the repo root
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

DIST_DIR="$REPO_ROOT/dist"

echo "🧹  Cleaning old build…"
rm -rf "$DIST_DIR"

echo "📦  Installing dependencies…"
npm ci        # faster + reproducible

echo "🏗️  Building project…"
npm run build

if [[ -d "$DIST_DIR" ]]; then
  echo "✅  Build successful!"
  echo "📤  Deploying to Netlify…"
  netlify deploy --prod --dir "$DIST_DIR"
else
  echo "❌  Build failed – '$DIST_DIR' not found"
  echo "🔍  Checking for TypeScript errors…"
  npx tsc --noEmit
  exit 1
fi