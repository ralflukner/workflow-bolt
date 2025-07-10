#!/opt/homebrew/bin/bash
# store-firebase-config-secrets.sh
# Creates/updates Firebase client config in Google Secret Manager (GSM)
# – one secret per field
# – in two variants: kebab-case and ALL_CAPS_WITH_UNDERSCORES

set -euo pipefail

## -------------------------
# Resolve the GCP project ID without hard-coding it in the script.
# Priority: (1) explicit CLI arg, (2) $PROJECT_ID env var, (3) gcloud default.
## -------------------------

if [[ -n "${1:-}" ]]; then
  PROJECT_ID="$1"
elif [[ -n "${PROJECT_ID:-}" ]]; then
  PROJECT_ID="$PROJECT_ID"
else
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null)"
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ PROJECT_ID not specified. Pass it as the first argument, set the PROJECT_ID env var, or configure a default project via 'gcloud config set project'."
  exit 1
fi

# Map of secret IDs → values
# Modify the values or pull them from env-vars as required
declare -A SECRETS=(
  [firebase-api-key]="AIzaSyCIMBYxl3lMAPMAWOKzLjwItD_k-5Qbd-c"
  [firebase-auth-domain]="luknerlumina-firebase.firebaseapp.com"
  [firebase-project-id]="luknerlumina-firebase"
  [firebase-storage-bucket]="luknerlumina-firebase.appspot.com"
  [firebase-messaging-sender-id]="623450773640"
  [firebase-app-id]="1:623450773640:web:9afd63d3ccbb1fcb6fe73d"
  [firebase-measurement-id]="G-W6TX8WRN2Z"
)

create_or_add () {
  local ID=$1
  local VALUE=$2

  # Create secret if it does not yet exist
  if ! gcloud secrets describe "$ID" --project="$PROJECT_ID" &>/dev/null; then
    gcloud secrets create "$ID"        \
      --project="$PROJECT_ID"          \
      --replication-policy="automatic" \
      --labels="service=firebase,env=prod"
  fi

  # Add a new version containing the value
  echo -n "$VALUE" | \
    gcloud secrets versions add "$ID" --project="$PROJECT_ID" --data-file=-
}

for id in "${!SECRETS[@]}"; do
  value="${SECRETS[$id]}"

  # 1. kebab-case (original)
  create_or_add "$id" "$value"

  # 2. ALL_CAPS_WITH_UNDERSCORES
  upper=$(echo "$id" | tr '[:lower:]-' '[:upper:]_')
  create_or_add "$upper" "$value"

done

echo "✅ All secrets (kebab-case and ALL_CAPS) stored/updated in project $PROJECT_ID" 