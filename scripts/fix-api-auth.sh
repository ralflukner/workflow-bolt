#!/opt/homebrew/bin/bash

# Quick fix for API authentication issue

echo "🔧 Fixing Tebra PHP API authentication..."
echo "========================================"

# Get the API key from .env.local
API_KEY=$(grep "VITE_TEBRA_PROXY_API_KEY" .env.local | cut -d'=' -f2)

if [ -z "$API_KEY" ]; then
  echo "❌ Could not find VITE_TEBRA_PROXY_API_KEY in .env.local"
  exit 1
fi

echo "✅ Found API key in .env.local"

# Update Cloud Run service with the API key
echo "📤 Updating Cloud Run service..."
gcloud run services update tebra-php-api \
  --update-env-vars="INTERNAL_API_KEY=$API_KEY" \
  --region=us-central1 \
  --project=luknerlumina-firebase

if [ $? -eq 0 ]; then
  echo "✅ Cloud Run service updated successfully!"
  echo ""
  echo "🔄 The service is being redeployed. It may take a minute for changes to take effect."
  echo ""
  echo "📝 Next steps:"
  echo "1. Wait about 30 seconds for the deployment to complete"
  echo "2. Refresh your browser"
  echo "3. Try the 'Test Connection' button again"
else
  echo "❌ Failed to update Cloud Run service"
  echo ""
  echo "Alternative: Create the secret in Google Secret Manager:"
  echo "echo -n \"$API_KEY\" | gcloud secrets create tebra-internal-api-key --data-file=- --project=luknerlumina-firebase"
fi