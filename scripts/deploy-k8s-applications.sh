#!/bin/bash

# Deploy Kubernetes applications to GKE cluster
# This script should be run after the infrastructure is created

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-luknerlumina-firebase}"
REGION="${GCP_REGION:-us-central1}"
CLUSTER_NAME="secure-cluster-prod"

echo -e "${GREEN}=== Kubernetes Applications Deployment Script ===${NC}"
echo -e "Project: ${PROJECT_ID}"
echo -e "Region: ${REGION}"
echo -e "Cluster: ${CLUSTER_NAME}"
echo ""

# Get cluster credentials
echo -e "${YELLOW}Getting GKE cluster credentials...${NC}"
gcloud container clusters get-credentials ${CLUSTER_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID}

# Verify cluster connection
echo -e "${YELLOW}Verifying cluster connection...${NC}"
kubectl cluster-info

# Deploy Vikunja
echo -e "${GREEN}Deploying Vikunja...${NC}"
kubectl apply -f k8s/vikunja/namespace.yaml
kubectl apply -f k8s/vikunja/serviceaccount.yaml
kubectl apply -f k8s/vikunja/configmap.yaml

# Create Vikunja secrets from Terraform outputs
echo -e "${YELLOW}Creating Vikunja secrets...${NC}"
cd terraform/environments/prod

# Get connection details from Terraform
REDIS_HOST=$(terraform output -json redis_connection | jq -r '.host')
REDIS_PORT=$(terraform output -json redis_connection | jq -r '.port')
REDIS_AUTH=$(gcloud secrets versions access latest --secret="redis-auth-string-prod" --project=${PROJECT_ID})
DB_HOST=$(terraform output -raw vikunja_database)
DB_PASSWORD=$(gcloud secrets versions access latest --secret="vikunja-db-password-prod" --project=${PROJECT_ID})

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Create the secret
kubectl create secret generic vikunja-secret \
  --namespace=vikunja \
  --from-literal=VIKUNJA_DATABASE_HOST="${DB_HOST}" \
  --from-literal=VIKUNJA_DATABASE_USER="vikunja" \
  --from-literal=VIKUNJA_DATABASE_PASSWORD="${DB_PASSWORD}" \
  --from-literal=VIKUNJA_DATABASE_DATABASE="vikunja" \
  --from-literal=VIKUNJA_REDIS_HOST="${REDIS_HOST}:${REDIS_PORT}" \
  --from-literal=VIKUNJA_REDIS_PASSWORD="${REDIS_AUTH}" \
  --from-literal=VIKUNJA_SERVICE_JWT_SECRET="${JWT_SECRET}" \
  --from-literal=VIKUNJA_API_TOKEN="tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  --dry-run=client -o yaml | kubectl apply -f -

cd ../../../

# Deploy remaining Vikunja resources
kubectl apply -f k8s/vikunja/pvc.yaml
kubectl apply -f k8s/vikunja/deployment.yaml
kubectl apply -f k8s/vikunja/service.yaml
kubectl apply -f k8s/vikunja/ingress.yaml

# Wait for Vikunja deployment
echo -e "${YELLOW}Waiting for Vikunja deployment to be ready...${NC}"
kubectl rollout status deployment/vikunja -n vikunja --timeout=300s

# Deploy Tebra Worker
echo -e "${GREEN}Deploying Tebra Redis Worker...${NC}"
kubectl apply -f k8s/tebra-worker/namespace.yaml
kubectl apply -f k8s/tebra-worker/serviceaccount.yaml
kubectl apply -f k8s/tebra-worker/configmap.yaml

# Create Tebra Worker secrets
echo -e "${YELLOW}Creating Tebra Worker secrets...${NC}"
kubectl create secret generic tebra-worker-secret \
  --namespace=tebra-worker \
  --from-literal=REDIS_HOST="${REDIS_HOST}" \
  --from-literal=REDIS_PASSWORD="${REDIS_AUTH}" \
  --from-literal=TEBRA_PHP_API_URL="${TEBRA_PHP_API_URL:-https://tebra-api.luknerlumina.com}" \
  --from-literal=TEBRA_INTERNAL_API_KEY="${TEBRA_INTERNAL_API_KEY}" \
  --dry-run=client -o yaml | kubectl apply -f -

# Create service account key for worker
echo -e "${YELLOW}Creating service account key for Tebra Worker...${NC}"
gcloud iam service-accounts keys create /tmp/tebra-worker-key.json \
  --iam-account=tebra-worker-prod@${PROJECT_ID}.iam.gserviceaccount.com

kubectl create secret generic tebra-worker-gsa-key \
  --namespace=tebra-worker \
  --from-file=key.json=/tmp/tebra-worker-key.json \
  --dry-run=client -o yaml | kubectl apply -f -

rm -f /tmp/tebra-worker-key.json

# Update deployment with correct image
echo -e "${YELLOW}Updating Tebra Worker deployment with Docker image...${NC}"
sed "s|gcr.io/luknerlumina-firebase/tebra-redis-worker:latest|gcr.io/${PROJECT_ID}/tebra-redis-worker:latest|g" \
  k8s/tebra-worker/deployment.yaml | kubectl apply -f -

# Wait for Tebra Worker deployment
echo -e "${YELLOW}Waiting for Tebra Worker deployment to be ready...${NC}"
kubectl rollout status deployment/tebra-redis-worker -n tebra-worker --timeout=300s

# Get external IPs
echo -e "${GREEN}=== Deployment Status ===${NC}"

# Vikunja status
VIKUNJA_IP=$(kubectl get ingress vikunja-ingress -n vikunja -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending")
echo -e "${YELLOW}Vikunja:${NC}"
echo "  Status: $(kubectl get deployment vikunja -n vikunja -o jsonpath='{.status.conditions[?(@.type=="Available")].status}')"
echo "  External IP: ${VIKUNJA_IP}"
echo "  URL: https://vikunja.luknerlumina.com"

# Tebra Worker status
echo -e "${YELLOW}Tebra Redis Worker:${NC}"
echo "  Status: $(kubectl get deployment tebra-redis-worker -n tebra-worker -o jsonpath='{.status.conditions[?(@.type=="Available")].status}')"
echo "  Replicas: $(kubectl get deployment tebra-redis-worker -n tebra-worker -o jsonpath='{.status.readyReplicas}')/$(kubectl get deployment tebra-redis-worker -n tebra-worker -o jsonpath='{.spec.replicas}')"

# Show pods
echo -e "${GREEN}=== Running Pods ===${NC}"
kubectl get pods --all-namespaces | grep -E "(vikunja|tebra-worker)"

echo -e "${GREEN}=== Next Steps ===${NC}"
echo "1. Update DNS record for vikunja.luknerlumina.com to point to: ${VIKUNJA_IP}"
echo "2. Wait for SSL certificate provisioning (may take up to 15 minutes)"
echo "3. Test Vikunja access at https://vikunja.luknerlumina.com"
echo "4. Monitor logs:"
echo "   kubectl logs -f deployment/vikunja -n vikunja"
echo "   kubectl logs -f deployment/tebra-redis-worker -n tebra-worker" 