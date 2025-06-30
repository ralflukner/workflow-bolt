#!/bin/bash

# Setup Notification Channels for Google Cloud Monitoring
# This script creates notification channels and updates the alerting policies

set -e

echo "Setting up Google Cloud Monitoring notification channels..."

# Check if gcloud is configured
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: No active gcloud authentication found. Run 'gcloud auth login' first."
    exit 1
fi

# Get current project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project set. Run 'gcloud config set project YOUR_PROJECT_ID' first."
    exit 1
fi

echo "📋 Using project: $PROJECT_ID"

# Create notification channels
echo "📧 Creating email notification channels..."

# Critical alerts email
CRITICAL_EMAIL_ID=$(gcloud alpha monitoring channels create \
    --display-name="Critical Alerts Email" \
    --type=email \
    --channel-labels=email_address=alerts@luknerclinic.com \
    --format="value(name)")

echo "✅ Created critical email channel: $CRITICAL_EMAIL_ID"

# Development team email
DEV_EMAIL_ID=$(gcloud alpha monitoring channels create \
    --display-name="Dev Team Email" \
    --type=email \
    --channel-labels=email_address=dev@luknerclinic.com \
    --format="value(name)")

echo "✅ Created dev email channel: $DEV_EMAIL_ID"

# Slack channel (optional - uncomment and configure if needed)
# echo "💬 Creating Slack notification channel..."
# SLACK_ID=$(gcloud alpha monitoring channels create \
#     --display-name="Lukner Clinic Slack" \
#     --type=slack \
#     --channel-labels=channel_name="#alerts",url="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
#     --format="value(name)")
# echo "✅ Created Slack channel: $SLACK_ID"

# For now, use email for Slack notifications until Slack webhook is configured
SLACK_ID=$CRITICAL_EMAIL_ID

# Update alerting policies YAML file
YAML_FILE="monitoring/alerting-policies.yaml"
if [ ! -f "$YAML_FILE" ]; then
    echo "❌ Error: $YAML_FILE not found. Run this script from the project root."
    exit 1
fi

echo "📝 Updating $YAML_FILE with notification channel IDs..."

# Create backup
cp "$YAML_FILE" "$YAML_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Replace placeholder values in YAML
sed -i.tmp \
    -e "s|PROJECT_ID|$PROJECT_ID|g" \
    -e "s|CRITICAL_EMAIL_CHANNEL_ID|${CRITICAL_EMAIL_ID##*/}|g" \
    -e "s|DEV_EMAIL_CHANNEL_ID|${DEV_EMAIL_ID##*/}|g" \
    -e "s|SLACK_CHANNEL_ID|${SLACK_ID##*/}|g" \
    "$YAML_FILE"

rm "$YAML_FILE.tmp"

echo "✅ Updated $YAML_FILE with notification channel IDs"

# Deploy the policies
echo "🚀 Deploying alerting policies..."
gcloud alpha monitoring policies create --policy-from-file="$YAML_FILE"

echo "🎉 Setup complete!"
echo ""
echo "📋 Summary:"
echo "  - Critical Email Channel: $CRITICAL_EMAIL_ID"
echo "  - Dev Email Channel: $DEV_EMAIL_ID"
echo "  - Slack Channel: $SLACK_ID"
echo ""
echo "💡 To configure Slack notifications:"
echo "  1. Create a Slack webhook URL"
echo "  2. Uncomment the Slack channel creation in this script"
echo "  3. Update the webhook URL and re-run the script"
echo ""
echo "📊 Monitor your alerts at: https://console.cloud.google.com/monitoring/alerting"
