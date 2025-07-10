#!/bin/bash

# Deploy GCP Infrastructure for Redis, PostgreSQL, and Vikunja
# This script sets up the complete infrastructure on Google Cloud Platform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-luknerlumina-firebase}"
REGION="${GCP_REGION:-us-central1}"
ENVIRONMENT="${ENVIRONMENT:-prod}"

echo -e "${GREEN}=== GCP Infrastructure Deployment Script ===${NC}"
echo -e "Project: ${PROJECT_ID}"
echo -e "Region: ${REGION}"
echo -e "Environment: ${ENVIRONMENT}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: terraform is not installed${NC}"
    echo "Please install Terraform: https://www.terraform.io/downloads"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    echo "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Authenticate with GCP
echo -e "${YELLOW}Authenticating with GCP...${NC}"
gcloud auth application-default login

# Set the project
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}Enabling required GCP APIs...${NC}"
gcloud services enable \
    compute.googleapis.com \
    container.googleapis.com \
    redis.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    cloudkms.googleapis.com \
    cloudfunctions.googleapis.com \
    cloudbuild.googleapis.com \
    vpcaccess.googleapis.com \
    servicenetworking.googleapis.com \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com \
    artifactregistry.googleapis.com

# Create terraform state bucket if it doesn't exist
echo -e "${YELLOW}Creating Terraform state bucket...${NC}"
gsutil mb -p ${PROJECT_ID} -l ${REGION} gs://luknerlumina-terraform-state || true

# Enable versioning on the bucket
gsutil versioning set on gs://luknerlumina-terraform-state

# Navigate to terraform directory
cd terraform/environments/prod

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init

# Plan the deployment
echo -e "${YELLOW}Planning infrastructure deployment...${NC}"
terraform plan -var="project_id=${PROJECT_ID}" -var="region=${REGION}" -out=tfplan

# Ask for confirmation
echo -e "${YELLOW}Do you want to apply this plan? (yes/no)${NC}"
read -r response
if [[ "$response" != "yes" ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Apply the plan
echo -e "${YELLOW}Applying infrastructure changes...${NC}"
terraform apply tfplan

# Get outputs
echo -e "${GREEN}Infrastructure deployment complete!${NC}"
echo -e "${YELLOW}Retrieving connection information...${NC}"

# Save outputs to file
terraform output -json > infrastructure-outputs.json

# Configure kubectl
echo -e "${YELLOW}Configuring kubectl...${NC}"
gcloud container clusters get-credentials secure-cluster-${ENVIRONMENT} --region=${REGION} --project=${PROJECT_ID}

# Create secret management script
echo -e "${YELLOW}Creating secret management script...${NC}"
cat > populate-k8s-secrets.sh << 'EOF'
#!/bin/bash
# Populate Kubernetes secrets from Google Secret Manager

# Get values from Terraform outputs
REDIS_HOST=$(terraform output -json | jq -r '.redis_connection.value.host')
REDIS_AUTH=$(gcloud secrets versions access latest --secret="redis-auth-string-prod" --project=${PROJECT_ID})
DB_HOST=$(terraform output -json | jq -r '.vikunja_database.value')
DB_PASSWORD=$(gcloud secrets versions access latest --secret="vikunja-db-password-prod" --project=${PROJECT_ID})

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Create the actual secret in Kubernetes
kubectl create secret generic vikunja-secret \
  --namespace=vikunja \
  --from-literal=VIKUNJA_DATABASE_HOST="${DB_HOST}" \
  --from-literal=VIKUNJA_DATABASE_USER="vikunja" \
  --from-literal=VIKUNJA_DATABASE_PASSWORD="${DB_PASSWORD}" \
  --from-literal=VIKUNJA_DATABASE_DATABASE="vikunja" \
  --from-literal=VIKUNJA_REDIS_HOST="${REDIS_HOST}:6379" \
  --from-literal=VIKUNJA_REDIS_PASSWORD="${REDIS_AUTH}" \
  --from-literal=VIKUNJA_SERVICE_JWT_SECRET="${JWT_SECRET}" \
  --from-literal=VIKUNJA_API_TOKEN="tk_556fc1cf49295b3c8637506e57877c21f863ec16" \
  --dry-run=client -o yaml | kubectl apply -f -
EOF

chmod +x populate-k8s-secrets.sh

# Deploy Vikunja to Kubernetes
echo -e "${YELLOW}Deploying Vikunja to Kubernetes...${NC}"

# Apply all Kubernetes manifests
kubectl apply -f ../../../k8s/vikunja/namespace.yaml
kubectl apply -f ../../../k8s/vikunja/serviceaccount.yaml
kubectl apply -f ../../../k8s/vikunja/configmap.yaml

# Populate secrets
./populate-k8s-secrets.sh

# Apply remaining manifests
kubectl apply -f ../../../k8s/vikunja/pvc.yaml
kubectl apply -f ../../../k8s/vikunja/deployment.yaml
kubectl apply -f ../../../k8s/vikunja/service.yaml
kubectl apply -f ../../../k8s/vikunja/ingress.yaml

# Wait for deployment
echo -e "${YELLOW}Waiting for Vikunja deployment to be ready...${NC}"
kubectl rollout status deployment/vikunja -n vikunja --timeout=300s

# Get the external IP
echo -e "${YELLOW}Waiting for external IP assignment...${NC}"
for i in {1..60}; do
    EXTERNAL_IP=$(kubectl get ingress vikunja-ingress -n vikunja -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
    if [[ -n "$EXTERNAL_IP" ]]; then
        break
    fi
    echo -n "."
    sleep 5
done
echo ""

if [[ -n "$EXTERNAL_IP" ]]; then
    echo -e "${GREEN}Vikunja is accessible at: https://vikunja.luknerlumina.com${NC}"
    echo -e "${YELLOW}External IP: ${EXTERNAL_IP}${NC}"
    echo -e "${YELLOW}Please update your DNS to point vikunja.luknerlumina.com to ${EXTERNAL_IP}${NC}"
else
    echo -e "${RED}Warning: Could not retrieve external IP. Check the ingress status.${NC}"
fi

# Display connection information
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update DNS records for vikunja.luknerlumina.com"
echo "2. Wait for SSL certificate provisioning (may take up to 15 minutes)"
echo "3. Configure Cloud Armor security policy with allowed IPs"
echo "4. Deploy the Tebra Redis Worker"
echo "5. Update frontend to use new Redis API endpoints"
echo ""
echo -e "${YELLOW}Connection details saved to: infrastructure-outputs.json${NC}"
echo -e "${YELLOW}To view Vikunja logs:${NC} kubectl logs -f deployment/vikunja -n vikunja"
echo -e "${YELLOW}To access the cluster:${NC} kubectl get pods -n vikunja" 