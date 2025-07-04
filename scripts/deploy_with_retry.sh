#!/bin/bash
set -euo pipefail

NAME="$1"
GCLOUD_CMD="$2"

echo "🚀 Deploying $NAME..."

# Deploy with retry logic
RETRY_COUNT=0
MAX_RETRIES=3

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if cd "functions/$NAME" && $GCLOUD_CMD --allow-unauthenticated; then
        echo "✅ Deployed $NAME successfully!"
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Deploy failed, retrying in 5s... (attempt $RETRY_COUNT/$MAX_RETRIES)"
            sleep 5
        fi
    fi
done

echo "❌ Deploy failed after $MAX_RETRIES attempts"
exit 1