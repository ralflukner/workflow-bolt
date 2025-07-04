#!/bin/bash
# Setup VPC connector for Cloud Functions/Run to access Memorystore

CONNECTOR_NAME="redis-connector"
REGION="us-central1"
PROJECT_ID="luknerlumina-firebase"

echo "🔧 Setting up VPC connector for serverless access..."

# Enable required API
gcloud services enable vpcaccess.googleapis.com --project=$PROJECT_ID

# Create VPC connector
gcloud compute networks vpc-access connectors create $CONNECTOR_NAME     --region=$REGION     --subnet=default     --subnet-project=$PROJECT_ID     --min-instances=2     --max-instances=10     --machine-type=e2-micro     --project=$PROJECT_ID

echo "✅ VPC connector created!"
echo ""
echo "📝 To use in Cloud Functions, add to firebase.json:"
echo '  "functions": {'
echo '    "runtime": "nodejs20",'
echo '    "vpcConnector": "redis-connector",'
echo '    "vpcConnectorEgressSettings": "PRIVATE_RANGES_ONLY"'
echo '  }'
