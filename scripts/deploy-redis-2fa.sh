#!/bin/bash
# deploy-redis-2fa.sh
# Deploy complete Redis 2FA system to Google Cloud

set -euo pipefail

PROJECT="${GCLOUD_PROJECT:-luknerlumina-firebase}"
REGION="us-central1"

echo "🚀 Deploying Redis 2FA System to Google Cloud"
echo "=============================================="

# 1. Run initial setup
echo "📋 Running initial setup..."
./scripts/setup-redis-2fa-system.sh

# 2. Install Python dependencies for local testing
echo "📦 Installing Python dependencies..."
pip install pyotp qrcode google-cloud-secret-manager redis[ssl] Pillow

# 3. Deploy Cloud Function
echo "☁️ Deploying secret rotation Cloud Function..."
cd functions
npm install @google-cloud/secret-manager @google-cloud/pubsub redis

gcloud functions deploy redisSecretRotator \
  --runtime=nodejs20 \
  --trigger-topic=redis-secret-rotation \
  --entry-point=redisSecretRotator \
  --source=src \
  --project="$PROJECT" \
  --region="$REGION" \
  --service-account="redis-secret-rotator@$PROJECT.iam.gserviceaccount.com" \
  --set-env-vars="GCP_PROJECT=$PROJECT"

# Deploy HTTP trigger for manual rotation
gcloud functions deploy redisSecretRotatorHttp \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=redisSecretRotatorHttp \
  --source=src \
  --project="$PROJECT" \
  --region="$REGION" \
  --service-account="redis-secret-rotator@$PROJECT.iam.gserviceaccount.com" \
  --set-env-vars="GCP_PROJECT=$PROJECT"

cd ..

# 4. Create Cloud Scheduler job for daily rotation checks
echo "⏰ Setting up Cloud Scheduler..."
gcloud scheduler jobs create pubsub redis-daily-rotation-check \
  --schedule="0 2 * * *" \
  --topic="redis-secret-rotation" \
  --message-body='{"type":"daily_check"}' \
  --project="$PROJECT" \
  --location="$REGION" || echo "Scheduler job already exists"

# 5. Make scripts executable
chmod +x scripts/redis-user-manager.py

echo "✅ Redis 2FA System deployed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Create your first user:"
echo "   python3 scripts/redis-user-manager.py create --user-type agent"
echo ""
echo "2. Test TOTP verification:"
echo "   python3 scripts/redis-user-manager.py verify-totp --username <username> --totp-code <code>"
echo ""
echo "3. Generate QR code for Google Authenticator:"
echo "   python3 scripts/redis-user-manager.py qr-code --username <username> --output-qr qr.png"
echo ""
echo "4. Test custom 2FA:"
echo "   python3 scripts/redis-user-manager.py verify-custom --username <username> --custom-code <code>"
echo ""
echo "📱 Cloud Function URLs:"
HTTP_URL=$(gcloud functions describe redisSecretRotatorHttp --region="$REGION" --project="$PROJECT" --format="value(httpsTrigger.url)" 2>/dev/null || echo "Not deployed")
echo "   Manual rotation: $HTTP_URL"