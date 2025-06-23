#!/bin/bash

# Tebra PHP API Cloud Run Deployment Script

set -e

# Configuration
PROJECT_ID="luknerlumina-firebase"
SERVICE_NAME="tebra-php-api"
REGION="us-central1"

echo "🚀 Deploying Tebra PHP API to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Set the project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Build and deploy to Cloud Run
echo "🏗️  Building and deploying..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update Firestore config at 'config/app' with:"
echo "   {\"tebraPhpApiUrl\": \"$SERVICE_URL/api\"}"
echo ""
echo "2. Ensure secrets are created in Google Secret Manager:"
echo "   - tebra-username"
echo "   - tebra-password"
echo "   - tebra-customer-key"
echo "   - tebra-internal-api-key (optional)"
echo ""
echo "3. Grant service account access to secrets:"
echo "   gcloud secrets add-iam-policy-binding tebra-username \\"
echo "     --member=\"serviceAccount:tebra-php-api@$PROJECT_ID.iam.gserviceaccount.com\" \\"
echo "     --role=\"roles/secretmanager.secretAccessor\""
echo ""
echo "4. Test the API:"
echo "   curl $SERVICE_URL/api/health"