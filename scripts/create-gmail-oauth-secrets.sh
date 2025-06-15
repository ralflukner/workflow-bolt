#!/bin/bash
set -euo pipefail

# This script securely manages Gmail OAuth2 credentials in Google Secret Manager
# Version 2.0 - Completely rewritten to follow security best practices
# No hardcoded credentials - interactive prompts only

# Configuration
PROJECT_ID="luknerlumina-firebase"
SERVICE_ACCOUNT="tebra-cloud-run-sa@luknerlumina-firebase.iam.gserviceaccount.com"
SECRET_ID_CLIENT_ID="GMAIL_CLIENT_ID"
SECRET_ID_CLIENT_SECRET="GMAIL_CLIENT_SECRET"
CLIENT_ID="read-from-Secret-Manager"
# Status tracking
STATUS_CLIENT_ID="NOT_PROCESSED"
STATUS_CLIENT_SECRET="NOT_PROCESSED"
STATUS_IAM="NOT_PROCESSED"

# Display header
echo "=================================================="
CLIENT_SECRET="read-from-Secret-Manager"
echo "  Project: $PROJECT_ID"
echo "=================================================="

# Collect credentials securely
echo -e "\n📝 Please enter your Gmail OAuth2 credentials:"
read -p "  OAuth2 Client ID: " CLIENT_ID
read -s -p "  OAuth2 Client Secret: " CLIENT_SECRET
echo ""

# Input validation with detailed feedback
if [ -z "$CLIENT_ID" ]; then
  echo -e "❌ ERROR: OAuth2 Client ID cannot be empty"
  echo -e "   Please obtain this from Google Cloud Console > APIs & Services > Credentials"
  exit 1
fi

if [ -z "$CLIENT_SECRET" ]; then
  echo -e "❌ ERROR: OAuth2 Client Secret cannot be empty"
  echo -e "   Please obtain this from Google Cloud Console > APIs & Services > Credentials"
  exit 1
fi

echo -e "\n🔐 Managing secrets in Google Secret Manager..."

# Process Client ID
echo -e "\n📋 Processing Client ID..."
if gcloud secrets describe $SECRET_ID_CLIENT_ID --project=$PROJECT_ID &>/dev/null; then
  echo -e "  ℹ️ Secret $SECRET_ID_CLIENT_ID already exists"
  echo -e "  🔄 Updating with new version..."

  if echo -n "$CLIENT_ID" | gcloud secrets versions add $SECRET_ID_CLIENT_ID \
      --project=$PROJECT_ID \
      --data-file=- &>/dev/null; then
    echo -e "  ✅ Successfully updated $SECRET_ID_CLIENT_ID"
    STATUS_CLIENT_ID="UPDATED"
  else
    echo -e "  ❌ Failed to update $SECRET_ID_CLIENT_ID"
    STATUS_CLIENT_ID="UPDATE_FAILED"
  fi
else
  echo -e "  🆕 Creating new secret $SECRET_ID_CLIENT_ID..."

  if echo -n "$CLIENT_ID" | gcloud secrets create $SECRET_ID_CLIENT_ID \
      --project=$PROJECT_ID \
      --replication-policy="automatic" \
      --data-file=- &>/dev/null; then
    echo -e "  ✅ Successfully created $SECRET_ID_CLIENT_ID"
    STATUS_CLIENT_ID="CREATED"
  else
    echo -e "  ❌ Failed to create $SECRET_ID_CLIENT_ID"
    STATUS_CLIENT_ID="CREATE_FAILED"
  fi
fi

# Process Client Secret
echo -e "\n🔑 Processing Client Secret..."
if gcloud secrets describe $SECRET_ID_CLIENT_SECRET --project=$PROJECT_ID &>/dev/null; then
  echo -e "  ℹ️ Secret $SECRET_ID_CLIENT_SECRET already exists"
  echo -e "  🔄 Updating with new version..."

  if echo -n "$CLIENT_SECRET" | gcloud secrets versions add $SECRET_ID_CLIENT_SECRET \
      --project=$PROJECT_ID \
      --data-file=- &>/dev/null; then
    echo -e "  ✅ Successfully updated $SECRET_ID_CLIENT_SECRET"
    STATUS_CLIENT_SECRET="UPDATED"
  else
    echo -e "  ❌ Failed to update $SECRET_ID_CLIENT_SECRET"
    STATUS_CLIENT_SECRET="UPDATE_FAILED"
  fi
else
  echo -e "  🆕 Creating new secret $SECRET_ID_CLIENT_SECRET..."

  if echo -n "$CLIENT_SECRET" | gcloud secrets create $SECRET_ID_CLIENT_SECRET \
      --project=$PROJECT_ID \
      --replication-policy="automatic" \
      --data-file=- &>/dev/null; then
    echo -e "  ✅ Successfully created $SECRET_ID_CLIENT_SECRET"
    STATUS_CLIENT_SECRET="CREATED"
  else
    echo -e "  ❌ Failed to create $SECRET_ID_CLIENT_SECRET"
    STATUS_CLIENT_SECRET="CREATE_FAILED"
  fi
fi

# Configure IAM permissions
echo -e "\n👮 Setting up IAM permissions..."
echo -e "  🔑 Service Account: $SERVICE_ACCOUNT"

# Process IAM permissions for Client ID
echo -e "\n  🛡️ Configuring access for $SECRET_ID_CLIENT_ID..."
if gcloud secrets add-iam-policy-binding $SECRET_ID_CLIENT_ID \
  --project=$PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" &>/dev/null; then
  echo -e "  ✅ Successfully granted access to $SECRET_ID_CLIENT_ID"
  STATUS_IAM_CLIENT_ID="SUCCESS"
else
  echo -e "  ❌ Failed to grant access to $SECRET_ID_CLIENT_ID"
  STATUS_IAM_CLIENT_ID="FAILED"
  STATUS_IAM="PARTIAL_FAILURE"
fi

# Process IAM permissions for Client Secret
echo -e "\n  🛡️ Configuring access for $SECRET_ID_CLIENT_SECRET..."
if gcloud secrets add-iam-policy-binding $SECRET_ID_CLIENT_SECRET \
  --project=$PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" &>/dev/null; then
  echo -e "  ✅ Successfully granted access to $SECRET_ID_CLIENT_SECRET"
  STATUS_IAM_CLIENT_SECRET="SUCCESS"
else
  echo -e "  ❌ Failed to grant access to $SECRET_ID_CLIENT_SECRET"
  STATUS_IAM_CLIENT_SECRET="FAILED"
  STATUS_IAM="PARTIAL_FAILURE"
fi

if [ "$STATUS_IAM" = "NOT_PROCESSED" ]; then
  if [ "$STATUS_IAM_CLIENT_ID" = "SUCCESS" ] && [ "$STATUS_IAM_CLIENT_SECRET" = "SUCCESS" ]; then
    STATUS_IAM="SUCCESS"
  else
    STATUS_IAM="FAILED"
  fi
fi

# Generate comprehensive report
echo -e "\n📊 OPERATION SUMMARY"
echo -e "=================================================="
echo -e "  Client ID Secret ($SECRET_ID_CLIENT_ID):"
echo -e "    Status: $STATUS_CLIENT_ID"
echo -e "    IAM Access: $STATUS_IAM_CLIENT_ID"
echo -e ""
echo -e "  Client Secret ($SECRET_ID_CLIENT_SECRET):"
echo -e "    Status: $STATUS_CLIENT_SECRET"
echo -e "    IAM Access: $STATUS_IAM_CLIENT_SECRET"
echo -e "=================================================="

# Final status message
echo -e ""
if [ "$STATUS_CLIENT_ID" = "CREATED" ] || [ "$STATUS_CLIENT_ID" = "UPDATED" ] && \
   [ "$STATUS_CLIENT_SECRET" = "CREATED" ] || [ "$STATUS_CLIENT_SECRET" = "UPDATED" ] && \
   [ "$STATUS_IAM" = "SUCCESS" ]; then
  echo -e "✅ SUCCESS: OAuth2 secrets successfully managed and secured!"
  echo -e "   Your Gmail integration is now properly configured."
else
  echo -e "⚠️ WARNING: Some operations were not successful."
  echo -e "   Please review the logs above and resolve any issues."
  echo -e "   You may need to run this script again or perform manual steps."
fi
echo -e ""
