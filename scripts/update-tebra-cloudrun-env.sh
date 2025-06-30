#!/opt/homebrew/bin/bash
set -euo pipefail

# This script updates the Cloud Run service to use environment variables instead of secrets

# Set the project ID and region
PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"

# Update the Cloud Run service with environment variables
echo "Updating Cloud Run service with environment variables..."

gcloud run services update tebra-php-api \
  --project=$PROJECT_ID \
  --region=$REGION \
  --set-env-vars="TEBRA_USERNAME=<YOUR_USERNAME>,TEBRA_PASSWORD=<YOUR_PASSWORD>,TEBRA_WSDL_URL=https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey=j57wt68dc39q,TEBRA_CUSTOMER_KEY=j57wt68dc39q,INTERNAL_API_KEY=<YOUR_API_KEY>"

echo "Cloud Run service updated successfully!"