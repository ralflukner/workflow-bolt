#!/opt/homebrew/bin/bash
# Setup Google Cloud Memorystore for Redis

PROJECT_ID="luknerlumina-firebase"
REGION="us-central1"
REDIS_INSTANCE_NAME="workflow-redis"
NETWORK="default"

echo "🚀 Setting up Google Cloud Memorystore for Redis"
echo "================================================"

# 1. Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable redis.googleapis.com --project=$PROJECT_ID
gcloud services enable servicenetworking.googleapis.com --project=$PROJECT_ID

# 2. Create Redis instance
echo "🔧 Creating Redis instance..."
echo "This may take 5-10 minutes..."

gcloud redis instances create $REDIS_INSTANCE_NAME \
    --size=1 \
    --region=$REGION \
    --redis-version=redis_7_0 \
    --network=projects/$PROJECT_ID/global/networks/$NETWORK \
    --project=$PROJECT_ID

# 3. Get Redis instance details
echo "📍 Getting Redis instance details..."
REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format="value(host)")

REDIS_PORT=$(gcloud redis instances describe $REDIS_INSTANCE_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format="value(port)")

echo "✅ Redis instance created!"
echo "   Host: $REDIS_HOST"
echo "   Port: $REDIS_PORT"

# 4. Create updated Redis connection files for Memorystore
cat > redis_memorystore.py << EOF
#!/usr/bin/env python3
"""
Connect to Google Cloud Memorystore Redis (no SSL needed)
"""
import redis
import json
import os
from datetime import datetime

# Memorystore connection details
REDIS_HOST = "$REDIS_HOST"
REDIS_PORT = $REDIS_PORT

def connect_to_redis():
    """
    Connect to Google Cloud Memorystore Redis
    """
    try:
        print(f"🔄 Connecting to Memorystore Redis at {REDIS_HOST}:{REDIS_PORT}...")
        
        client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True,
            socket_connect_timeout=10,
            socket_timeout=10,
        )
        
        client.ping()
        print("✅ Connected successfully to Memorystore!")
        return client
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Make sure you're either:")
        print("   1. Running from a GCE instance in the same VPC")
        print("   2. Connected via Cloud VPN")
        print("   3. Using Cloud Run/Functions with VPC connector")
        return None

def send_message(r, sender, action, payload):
    """
    Send a message through Redis pub/sub
    """
    if not r:
        print("❌ ERROR: Redis client not provided or not connected.")
        return False
    try:
        message = {
            "sender": sender,
            "action": action,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        }
        r.publish("events", json.dumps(message))
        print(f"✅ Message sent: {action} from {sender}")
        return True
    except Exception as e:
        print(f"❌ ERROR sending message: {e}")
        return False

if __name__ == "__main__":
    r = connect_to_redis()
    if r:
        print("📝 Testing connection...")
        r.set('test', 'hello from Memorystore!', ex=60)
        print(f"✅ Test value: {r.get('test')}")
        
        # Test pub/sub
        send_message(r, "test_client", "health_check", {"status": "ok"})
EOF

chmod +x redis_memorystore.py

# 5. Create environment variable update script
cat > update_redis_env.sh << EOF
#!/bin/bash
# Update environment variables for Memorystore Redis

echo "🔧 Updating Redis environment variables..."

# Update .env file
if [ -f .env ]; then
    cp .env .env.redis-backup
    
    # Remove old Redis Cloud variables
    grep -v "REDIS_HOST\|REDIS_PORT\|REDIS_PASSWORD\|REDIS_URL" .env > .env.tmp
    
    # Add Memorystore variables
    echo "" >> .env.tmp
    echo "# Google Cloud Memorystore Redis" >> .env.tmp
    echo "REDIS_HOST=$REDIS_HOST" >> .env.tmp
    echo "REDIS_PORT=$REDIS_PORT" >> .env.tmp
    echo "# No password needed for Memorystore in VPC" >> .env.tmp
    
    mv .env.tmp .env
    echo "✅ Updated .env file"
fi

# Update functions/.env if it exists
if [ -f functions/.env ]; then
    cp functions/.env functions/.env.redis-backup
    
    grep -v "REDIS_HOST\|REDIS_PORT\|REDIS_PASSWORD\|REDIS_URL" functions/.env > functions/.env.tmp
    
    echo "" >> functions/.env.tmp
    echo "# Google Cloud Memorystore Redis" >> functions/.env.tmp
    echo "REDIS_HOST=$REDIS_HOST" >> functions/.env.tmp
    echo "REDIS_PORT=$REDIS_PORT" >> functions/.env.tmp
    
    mv functions/.env.tmp functions/.env
    echo "✅ Updated functions/.env file"
fi

echo "✅ Environment variables updated!"
EOF

chmod +x update_redis_env.sh

# 6. Create VPC connector setup script for Cloud Functions/Run
cat > setup_vpc_connector.sh << EOF
#!/bin/bash
# Setup VPC connector for Cloud Functions/Run to access Memorystore

CONNECTOR_NAME="redis-connector"
REGION="us-central1"
PROJECT_ID="$PROJECT_ID"

echo "🔧 Setting up VPC connector for serverless access..."

# Enable required API
gcloud services enable vpcaccess.googleapis.com --project=\$PROJECT_ID

# Create VPC connector
gcloud compute networks vpc-access connectors create \$CONNECTOR_NAME \
    --region=\$REGION \
    --subnet=default \
    --subnet-project=\$PROJECT_ID \
    --min-instances=2 \
    --max-instances=10 \
    --machine-type=e2-micro \
    --project=\$PROJECT_ID

echo "✅ VPC connector created!"
echo ""
echo "📝 To use in Cloud Functions, add to firebase.json:"
echo '  "functions": {'
echo '    "runtime": "nodejs20",'
echo '    "vpcConnector": "redis-connector",'
echo '    "vpcConnectorEgressSettings": "PRIVATE_RANGES_ONLY"'
echo '  }'
EOF

chmod +x setup_vpc_connector.sh

# 7. Create test script for local development with SSH tunnel
cat > setup_redis_tunnel.sh << EOF
#!/bin/bash
# Create SSH tunnel to access Memorystore from local development

echo "🚀 Setting up SSH tunnel to Memorystore Redis"
echo "============================================="

# You'll need a GCE instance in the same VPC as a jump host
JUMP_HOST_NAME="redis-jump-host"
ZONE="us-central1-a"
LOCAL_PORT=6379

echo "📦 Creating minimal jump host VM..."
gcloud compute instances create \$JUMP_HOST_NAME \
    --machine-type=e2-micro \
    --zone=\$ZONE \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --tags=redis-tunnel \
    --project=$PROJECT_ID

echo "⏳ Waiting for VM to be ready..."
sleep 30

echo "🔧 Creating SSH tunnel..."
echo "Local port $LOCAL_PORT will forward to $REDIS_HOST:$REDIS_PORT"

gcloud compute ssh \$JUMP_HOST_NAME \
    --zone=\$ZONE \
    --project=$PROJECT_ID \
    -- -N -L \$LOCAL_PORT:$REDIS_HOST:$REDIS_PORT

# This will keep running until you Ctrl+C
EOF

chmod +x setup_redis_tunnel.sh

echo ""
echo "✅ Setup scripts created!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Update your environment variables:"
echo "   ./update_redis_env.sh"
echo ""
echo "2. For Cloud Functions/Run access, setup VPC connector:"
echo "   ./setup_vpc_connector.sh"
echo ""
echo "3. For local development, create SSH tunnel:"
echo "   ./setup_redis_tunnel.sh"
echo "   # Then connect to localhost:6379"
echo ""
echo "4. Update your code to use simple Redis connection:"
echo "   host: $REDIS_HOST"
echo "   port: $REDIS_PORT"
echo "   ssl: false"
echo "   password: none"
echo ""
echo "🎉 No more SSL issues!"