#!/bin/bash

# Deploy Redis and PostgreSQL services to replace Firebase
# This script builds and deploys the new services to Google Cloud

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"
REDIS_ENDPOINT_SERVICE="redis-publish-endpoint"
WORKER_IMAGE="tebra-redis-worker"

echo -e "${GREEN}=== Deploying Redis/PostgreSQL Services ===${NC}"
echo -e "${YELLOW}Replacing Firebase Functions with new architecture${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}1. Checking prerequisites...${NC}"
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}gcloud CLI is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    exit 1
fi

# Set project
gcloud config set project ${PROJECT_ID}

# Build and deploy Redis publish endpoint
echo -e "\n${BLUE}2. Building Redis publish endpoint...${NC}"
cd docker/redis-publish-endpoint

# Build the Docker image
docker build -t gcr.io/${PROJECT_ID}/${REDIS_ENDPOINT_SERVICE}:latest .

# Push to Google Container Registry
echo -e "${YELLOW}Pushing image to GCR...${NC}"
docker push gcr.io/${PROJECT_ID}/${REDIS_ENDPOINT_SERVICE}:latest

# Deploy to Cloud Run
echo -e "\n${BLUE}3. Deploying Redis publish endpoint to Cloud Run...${NC}"
gcloud run deploy ${REDIS_ENDPOINT_SERVICE} \
  --image gcr.io/${PROJECT_ID}/${REDIS_ENDPOINT_SERVICE}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars="AUTH0_DOMAIN=luknerlumina.auth0.com,AUTH0_AUDIENCE=https://api.luknerlumina.com" \
  --set-secrets="REDIS_HOST=redis-host:latest,REDIS_PASSWORD=redis-password:latest" \
  --vpc-connector=projects/${PROJECT_ID}/locations/${REGION}/connectors/redis-connector \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1

# Get the service URL
REDIS_ENDPOINT_URL=$(gcloud run services describe ${REDIS_ENDPOINT_SERVICE} \
  --platform managed \
  --region ${REGION} \
  --format 'value(status.url)')

echo -e "${GREEN}✅ Redis publish endpoint deployed at: ${REDIS_ENDPOINT_URL}${NC}"

# Deploy PostgreSQL API (if needed)
echo -e "\n${BLUE}4. Setting up PostgreSQL API...${NC}"
echo -e "${YELLOW}PostgreSQL is accessed directly from the frontend via the persistence service${NC}"
echo -e "${YELLOW}No separate API deployment needed - using Cloud SQL Proxy${NC}"

# Create Cloud Scheduler jobs to replace Firebase scheduled functions
echo -e "\n${BLUE}5. Creating Cloud Scheduler jobs...${NC}"

# Create credential check job (replaces scheduledCredentialCheck)
gcloud scheduler jobs create http credential-check \
  --location=${REGION} \
  --schedule="0 */6 * * *" \
  --uri="${REDIS_ENDPOINT_URL}/api/scheduled/credential-check" \
  --http-method=POST \
  --attempt-deadline=30m \
  --description="Regular credential health check" || echo "Job already exists"

# Create daily purge job (replaces dailyPurge)
gcloud scheduler jobs create http daily-purge \
  --location=${REGION} \
  --schedule="0 2 * * *" \
  --uri="${REDIS_ENDPOINT_URL}/api/scheduled/daily-purge" \
  --http-method=POST \
  --attempt-deadline=30m \
  --description="Daily data purge for HIPAA compliance" || echo "Job already exists"

# Update environment variables
echo -e "\n${BLUE}6. Updating environment configuration...${NC}"
cd ../..

# Create or update .env with new endpoints
cat >> .env.redis-postgres << EOF

# Redis/PostgreSQL Configuration (Updated $(date))
VITE_REDIS_API_URL=${REDIS_ENDPOINT_URL}/api
VITE_REDIS_SSE_URL=${REDIS_ENDPOINT_URL}/events
REDIS_HOST=\${REDIS_HOST}
REDIS_PASSWORD=\${REDIS_PASSWORD}
POSTGRES_HOST=\${POSTGRES_HOST}
POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
POSTGRES_DATABASE=luknerlumina

# Feature flags
VITE_ENABLE_REDIS=true
VITE_ENABLE_POSTGRES=true
VITE_ENABLE_FIREBASE=false
EOF

echo -e "${GREEN}✅ Environment configuration updated${NC}"

# Summary
echo -e "\n${GREEN}=== Deployment Complete ===${NC}"
echo -e "\n${BLUE}Deployed Services:${NC}"
echo -e "- Redis Publish Endpoint: ${REDIS_ENDPOINT_URL}"
echo -e "- PostgreSQL: Via Cloud SQL Proxy"
echo -e "- Cloud Scheduler Jobs: credential-check, daily-purge"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "1. Run the Firestore to PostgreSQL migration:"
echo -e "   ${YELLOW}node scripts/migrate-firestore-to-postgres.js${NC}"
echo -e ""
echo -e "2. Update frontend environment variables:"
echo -e "   ${YELLOW}cp .env.redis-postgres .env${NC}"
echo -e ""
echo -e "3. Deploy the Tebra Redis Worker to Kubernetes:"
echo -e "   ${YELLOW}./scripts/deploy-k8s-applications.sh${NC}"
echo -e ""
echo -e "4. Test the new endpoints:"
echo -e "   ${YELLOW}curl ${REDIS_ENDPOINT_URL}/health${NC}"
echo -e ""
echo -e "5. Update DNS if needed"

echo -e "\n${YELLOW}⚠️  Keep Firebase active for 30 days as backup${NC}"
echo -e "${YELLOW}⚠️  Monitor logs for any issues during transition${NC}" 