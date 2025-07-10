#!/bin/bash
# Deploy Secure Redis and Vikunja Infrastructure on GCP
# This script sets up the VPC, Redis, Vikunja, and all supporting services

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
TERRAFORM_DIR="terraform/environments/${ENVIRONMENT}"

echo -e "${GREEN}🚀 Deploying Secure Infrastructure for Redis and Vikunja${NC}"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Environment: ${ENVIRONMENT}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK.${NC}"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform not found. Please install Terraform.${NC}"
    exit 1
fi

# Check if authenticated to GCP
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ Not authenticated to GCP. Run: gcloud auth login${NC}"
    exit 1
fi

# Set the project
echo -e "\n${YELLOW}Setting GCP project...${NC}"
gcloud config set project ${PROJECT_ID}

# Create Terraform state bucket if it doesn't exist
echo -e "\n${YELLOW}Ensuring Terraform state bucket exists...${NC}"
STATE_BUCKET="${PROJECT_ID}-terraform-state"
if ! gsutil ls -b gs://${STATE_BUCKET} &> /dev/null; then
    echo "Creating state bucket: ${STATE_BUCKET}"
    gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://${STATE_BUCKET}
    gsutil versioning set on gs://${STATE_BUCKET}
    gsutil lifecycle set /dev/stdin gs://${STATE_BUCKET} <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "isLive": false
        }
      }
    ]
  }
}
EOF
fi

# Initialize Terraform
echo -e "\n${YELLOW}Initializing Terraform...${NC}"
cd ${TERRAFORM_DIR}
terraform init -upgrade

# Create terraform.tfvars if it doesn't exist
if [ ! -f terraform.tfvars ]; then
    echo -e "\n${YELLOW}Creating terraform.tfvars...${NC}"
    cat > terraform.tfvars <<EOF
project_id = "${PROJECT_ID}"
region     = "${REGION}"

# Add your allowed IPs here for web access
# Example: allowed_ips = ["1.2.3.4/32", "5.6.7.8/32"]
allowed_ips = []
EOF
    echo -e "${YELLOW}⚠️  Please edit terraform.tfvars to add your allowed IP addresses${NC}"
fi

# Plan the deployment
echo -e "\n${YELLOW}Planning infrastructure deployment...${NC}"
terraform plan -out=tfplan

# Ask for confirmation
echo -e "\n${YELLOW}Ready to deploy the following resources:${NC}"
echo "- VPC Network with private subnets"
echo "- Cloud NAT for outbound connectivity"
echo "- Google Kubernetes Engine (GKE) cluster"
echo "- Cloud Memorystore for Redis (High Availability)"
echo "- Cloud SQL for PostgreSQL (Vikunja database)"
echo "- Cloud SQL for PostgreSQL (Redis logger database)"
echo "- Cloud Storage buckets for archives"
echo "- Secret Manager for credentials"
echo "- Service accounts and IAM bindings"
echo "- Cloud Armor security policies"

read -p "Do you want to proceed with deployment? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

# Apply the configuration
echo -e "\n${GREEN}Deploying infrastructure...${NC}"
terraform apply tfplan

# Get outputs
echo -e "\n${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo -e "\n${YELLOW}Retrieving connection information...${NC}"

# Save sensitive outputs to files
terraform output -json redis_connection > redis-connection.json
chmod 600 redis-connection.json

# Configure kubectl
echo -e "\n${YELLOW}Configuring kubectl...${NC}"
CLUSTER_NAME="secure-cluster-${ENVIRONMENT}"
gcloud container clusters get-credentials ${CLUSTER_NAME} --region=${REGION} --project=${PROJECT_ID}

# Create namespaces
echo -e "\n${YELLOW}Creating Kubernetes namespaces...${NC}"
kubectl create namespace vikunja --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace redis-workers --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Label namespaces for security
kubectl label namespace vikunja compliance=hipaa --overwrite
kubectl label namespace redis-workers compliance=hipaa --overwrite
kubectl label namespace monitoring compliance=hipaa --overwrite

# Display next steps
echo -e "\n${GREEN}✅ Infrastructure setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review and update terraform.tfvars with your allowed IPs"
echo "2. Deploy applications to the GKE cluster:"
echo "   - kubectl apply -f k8s/vikunja/"
echo "   - kubectl apply -f k8s/redis-workers/"
echo "3. Configure DNS to point to: $(terraform output -raw vikunja_ip)"
echo "4. Access Redis connection details: cat redis-connection.json"
echo "5. Dashboard API URL: $(terraform output -raw dashboard_api_url)"

echo -e "\n${YELLOW}Security reminders:${NC}"
echo "- All services are running in a private VPC"
echo "- Redis requires authentication (auth string in Secret Manager)"
echo "- Cloud SQL requires SSL connections"
echo "- Add your IPs to Cloud Armor for web access"
echo "- Enable audit logging for HIPAA compliance"

echo -e "\n${GREEN}🎉 Deployment complete!${NC}" 