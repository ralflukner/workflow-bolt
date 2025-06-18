#!/bin/bash
# Deploy script to fix the Tebra data flow bottleneck

echo "🚀 Deploying Tebra PHP API fixes to Cloud Run..."
echo "=============================================="

# Set variables
PROJECT_ID="${GCP_PROJECT:-luknerlumina-firebase}"
SERVICE_NAME="tebra-php-api"
REGION="us-central1"

echo "📋 Deployment Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo ""

# Ensure we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run from tebra-php-api directory."
    exit 1
fi

echo "🔍 Key fixes being deployed:"
echo "  ✅ Enhanced error handling with specific SOAP fault messages"
echo "  ✅ Partial redaction for sensitive data (passwords, usernames)"
echo "  ✅ Detailed logging with correlation IDs"
echo "  ✅ Health status tracking and metrics"
echo ""

# Build and deploy
echo "🏗️  Building container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --project $PROJECT_ID \
    --timeout=20m

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

echo "🚀 Deploying to Cloud Run..."
# Note: Environment variables are already configured as secrets in Cloud Run
# Do not attempt to update them as string literals
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 512Mi \
    --timeout 300 \
    --max-instances 10

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📊 Next steps to verify the fix:"
echo "  1. Run: node ../debug-tebra-connection.js"
echo "  2. Check the TebraDebugDashboard in the UI"
echo "  3. Look for specific error messages instead of generic ones"
echo ""
echo "🔍 Expected improvements:"
echo "  - Specific error: 'Tebra server bug: ValidationHelper null reference' instead of 'Internal error'"
echo "  - Partial data visibility: 'joh***@example.com (len: 20)' instead of '[REDACTED]'"
echo "  - Correlation IDs in all error responses"
echo ""
echo "📝 To view logs:"
echo "  gcloud run logs read --service $SERVICE_NAME --project $PROJECT_ID --region $REGION"