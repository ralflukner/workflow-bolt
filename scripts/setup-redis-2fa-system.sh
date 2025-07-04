#!/bin/bash
# setup-redis-2fa-system.sh
# Complete Redis Authentication System with TOTP 2FA and 90-day rotation
# Uses Google Cloud Secret Manager + Cloud Scheduler + Cloud Functions

set -euo pipefail

PROJECT="${GCLOUD_PROJECT:-luknerlumina-firebase}"
REGION="us-central1"

echo "🔐 Setting up Redis 2FA Authentication System"
echo "=============================================="
echo "Project: $PROJECT"
echo "Region: $REGION"

# 1. Enable required APIs
echo "📡 Enabling required Google Cloud APIs..."
gcloud services enable secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudfunctions.googleapis.com \
  pubsub.googleapis.com \
  identitytoolkit.googleapis.com \
  --project="$PROJECT"

# 2. Create Pub/Sub topic for rotation notifications
echo "📨 Creating Pub/Sub topic for secret rotation..."
gcloud pubsub topics create redis-secret-rotation --project="$PROJECT" || echo "Topic already exists"

# 3. Create service account for rotation functions
echo "👤 Creating service account for secret rotation..."
gcloud iam service-accounts create redis-secret-rotator \
  --display-name="Redis Secret Rotation Service Account" \
  --description="Service account for rotating Redis TOTP secrets" \
  --project="$PROJECT" || echo "Service account already exists"

# Grant necessary permissions
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:redis-secret-rotator@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"

gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:redis-secret-rotator@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

# 4. Create Redis user management secrets structure
echo "🗄️ Creating Redis user management secrets..."

# Create master configuration secret
cat > /tmp/redis-users-config.json << EOF
{
  "users": {},
  "rotation_schedule": "90d",
  "last_rotation": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "totp_settings": {
    "issuer": "LuknerLumina-Redis",
    "period": 30,
    "digits": 6,
    "algorithm": "SHA1"
  }
}
EOF

gcloud secrets create redis-users-config \
  --data-file=/tmp/redis-users-config.json \
  --replication-policy="automatic" \
  --next-rotation-time="$(date -d '+90 days' -u +%Y-%m-%dT%H:%M:%SZ)" \
  --rotation-period="7776000s" \
  --topics="projects/$PROJECT/topics/redis-secret-rotation" \
  --project="$PROJECT" || echo "Secret already exists"

rm /tmp/redis-users-config.json

echo "✅ Redis 2FA Authentication System setup initiated"
echo ""
echo "Next steps:"
echo "1. Deploy Cloud Functions for secret rotation"
echo "2. Create Redis users with TOTP secrets"
echo "3. Set up user management CLI tools"
echo "4. Configure emergency rotation procedures"