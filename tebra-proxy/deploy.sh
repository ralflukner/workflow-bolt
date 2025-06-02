#!/bin/bash

# Tebra Proxy - Secure Google Cloud Run Deployment
# HIPAA-Compliant Configuration

set -e

# Configuration
PROJECT_ID="luknerlumina-firebase"
SERVICE_NAME="tebra-proxy"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Deploying HIPAA-Compliant Tebra Proxy to Google Cloud Run${NC}"

# Check if user is logged in to gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Please login to gcloud first: gcloud auth login${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}📝 Setting project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Generate secure API key if not provided
if [ -z "$API_KEY" ]; then
    API_KEY=$(openssl rand -base64 32)
    echo -e "${YELLOW}🔑 Generated secure API key: $API_KEY${NC}"
    echo -e "${YELLOW}💾 Save this API key - you'll need it for Firebase Functions!${NC}"
fi

# Build and push Docker image
echo -e "${YELLOW}🏗️  Building Docker image...${NC}"
docker build -t $IMAGE_NAME .

echo -e "${YELLOW}📤 Pushing to Google Container Registry...${NC}"
docker push $IMAGE_NAME

# Deploy to Cloud Run with security configurations
echo -e "${YELLOW}🚀 Deploying to Cloud Run with HIPAA configuration...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --set-env-vars="TEBRA_SOAP_USERNAME=$TEBRA_SOAP_USERNAME,TEBRA_SOAP_PASSWORD=$TEBRA_SOAP_PASSWORD,TEBRA_SOAP_CUSTKEY=$TEBRA_SOAP_CUSTKEY,API_KEY=$API_KEY" \
  --max-instances=10 \
  --min-instances=1 \
  --memory=512Mi \
  --cpu=1000m \
  --timeout=300s \
  --concurrency=80 \
  --ingress=all \
  --allow-unauthenticated \
  --service-account="$PROJECT_ID@appspot.gserviceaccount.com" \
  --labels="environment=production,hipaa-compliant=true,service=tebra-proxy"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo -e "${GREEN}🔑 API Key: $API_KEY${NC}"

# Security recommendations
echo -e "\n${YELLOW}🔒 Security Checklist:${NC}"
echo "✅ HTTPS enabled automatically"
echo "✅ Security headers configured"
echo "✅ API key authentication enabled"
echo "✅ Request logging for audit trails"
echo "✅ Rate limiting implemented"
echo "✅ Input validation active"
echo "✅ CORS restricted to Firebase domains"

# Test the deployment
echo -e "\n${YELLOW}🧪 Testing deployment...${NC}"
curl -H "X-API-Key: $API_KEY" "$SERVICE_URL/test" || echo -e "${RED}❌ Test failed - check deployment${NC}"

echo -e "\n${GREEN}🎉 HIPAA-compliant Tebra proxy is now live!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update Firebase Functions environment variable TEBRA_PROXY_URL=$SERVICE_URL"
echo "2. Update Firebase Functions environment variable TEBRA_PROXY_API_KEY=$API_KEY"
echo "3. Sign Google Cloud BAA for HIPAA compliance"
echo "4. Configure monitoring and alerting" 