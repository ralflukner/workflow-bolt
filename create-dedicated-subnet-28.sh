#!/opt/homebrew/bin/bash
# Fix VPC connector by deleting and recreating

PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"

# 1. Delete the existing connector in ERROR state
echo "🗑️  Deleting existing connector in ERROR state..."
gcloud compute networks vpc-access connectors delete redis-connector \
    --region=$REGION \
    --project=$PROJECT_ID \
    --quiet

# 2. Wait a moment for deletion to complete
echo "⏳ Waiting for deletion to complete..."
sleep 10

# 3. Create new connector with the correct subnet
echo "🔧 Creating VPC connector with vpc-connector-subnet..."
gcloud compute networks vpc-access connectors create redis-connector \
    --region=$REGION \
    --subnet=vpc-connector-subnet \
    --subnet-project=$PROJECT_ID \
    --min-instances=2 \
    --max-instances=10 \
    --machine-type=e2-micro \
    --project=$PROJECT_ID

# 4. Verify the connector is READY
echo "✅ Checking connector status..."
gcloud compute networks vpc-access connectors describe redis-connector \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format="table(name,state,subnet.name)"