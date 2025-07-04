#!/bin/bash
# Create SSH tunnel to access Memorystore from local development

echo "🚀 Setting up SSH tunnel to Memorystore Redis"
echo "============================================="

# You'll need a GCE instance in the same VPC as a jump host
JUMP_HOST_NAME="redis-jump-host"
ZONE="us-central1-a"
LOCAL_PORT=6379

echo "📦 Creating minimal jump host VM..."
gcloud compute instances create $JUMP_HOST_NAME     --machine-type=e2-micro     --zone=$ZONE     --image-family=debian-11     --image-project=debian-cloud     --tags=redis-tunnel     --project=luknerlumina-firebase

echo "⏳ Waiting for VM to be ready..."
sleep 30

echo "🔧 Creating SSH tunnel..."
echo "Local port  will forward to 10.161.35.147:6379"

gcloud compute ssh $JUMP_HOST_NAME     --zone=$ZONE     --project=luknerlumina-firebase     -- -N -L $LOCAL_PORT:10.161.35.147:6379

# This will keep running until you Ctrl+C
