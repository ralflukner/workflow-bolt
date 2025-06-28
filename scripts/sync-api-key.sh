#!/bin/bash
# scripts/sync-api-key.sh

echo "🔍 Synchronizing API key across all environment files..."

# The correct API key that works
CORRECT_API_KEY="UlmgPDMHoMqP2KAMKGIJK4tudPlm7z7ertoJ6eTV3+Y="

# List all ACTUAL env files (not .example files)
ENV_FILES=(
    ".env"
    ".env.local"
    ".envrc"
    "functions/.env"
    "functions/.env.local"
    "functions/.env.yaml"
)

echo -e "\n📋 Checking for environment files..."
for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file"
        # Check if it contains the old API key
        if grep -q "VITE_TEBRA_PROXY_API_KEY=9c2ea0249c" "$file" 2>/dev/null; then
            echo "   ⚠️  Contains old API key - updating..."
            sed -i.bak "s/VITE_TEBRA_PROXY_API_KEY=.*/VITE_TEBRA_PROXY_API_KEY=$CORRECT_API_KEY/" "$file"
            echo "   ✅ Updated to new API key"
        elif grep -q "VITE_TEBRA_PROXY_API_KEY=" "$file" 2>/dev/null; then
            current_key=$(grep "VITE_TEBRA_PROXY_API_KEY=" "$file" | cut -d'=' -f2)
            if [ "$current_key" = "$CORRECT_API_KEY" ]; then
                echo "   ✅ Already has correct API key"
            else
                echo "   ⚠️  Has different API key: ${current_key:0:10}... - updating..."
                sed -i.bak "s/VITE_TEBRA_PROXY_API_KEY=.*/VITE_TEBRA_PROXY_API_KEY=$CORRECT_API_KEY/" "$file"
                echo "   ✅ Updated to new API key"
            fi
        else
            echo "   ℹ️  No VITE_TEBRA_PROXY_API_KEY found"
        fi
    fi
done

# Update Google Secret Manager
echo -e "\n☁️  Updating Google Secret Manager..."
PROJECT_ID="luknerluminar"
if command -v gcloud &> /dev/null; then
    # First check if the secret exists
    if gcloud secrets describe TEBRA_PROXY_API_KEY --project="$PROJECT_ID" &>/dev/null; then
        echo "Updating TEBRA_PROXY_API_KEY in GSM..."
        echo -n "$CORRECT_API_KEY" | gcloud secrets versions add TEBRA_PROXY_API_KEY --data-file=- --project="$PROJECT_ID"
        if [ $? -eq 0 ]; then
            echo "✅ Successfully updated GSM secret"
        else
            echo "❌ Failed to update GSM secret"
        fi
    else
        echo "Creating TEBRA_PROXY_API_KEY in GSM..."
        echo -n "$CORRECT_API_KEY" | gcloud secrets create TEBRA_PROXY_API_KEY --data-file=- --project="$PROJECT_ID"
        if [ $? -eq 0 ]; then
            echo "✅ Successfully created GSM secret"
        else
            echo "❌ Failed to create GSM secret"
        fi
    fi
else
    echo "⚠️  gcloud CLI not found - skipping GSM update"
fi

# Clear Node.js cache
echo -e "\n🧹 Clearing Node.js cache..."
rm -rf node_modules/.cache
rm -rf .vite
echo "✅ Cleared Node.js cache"

# Restart test watcher if running
echo -e "\n🔄 Restarting any test processes..."
pkill -f "jest.*watch" 2>/dev/null || true

# Summary
echo -e "\n📊 Summary:"
echo "- Checked ${#ENV_FILES[@]} potential environment files"
echo "- Updated all files containing the old API key"
echo "- New API key: ${CORRECT_API_KEY:0:10}... (${#CORRECT_API_KEY} chars)"

echo -e "\n⚠️  Next steps:"
echo "1. Close and reopen your terminal, or run: source .env"
echo "2. Run 'npm run test:real-api:gsm' to verify the fix"
echo "3. If the test still uses old key, restart your terminal/IDE"

# Show current status
echo -e "\n📍 Current API key in main .env:"
grep "VITE_TEBRA_PROXY_API_KEY=" .env | head -1

echo -e "\n🗑️  Backup files created (*.bak) - you can remove them after verifying everything works"