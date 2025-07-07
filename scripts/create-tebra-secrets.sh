#!/bin/bash
set -euo pipefail

# Modernized script to (re)create or update Tebra-related secrets in Google Secret Manager.
# Usage:
#   ./create-tebra-secrets.sh <username> <password> [customer_key] [project_id] [internal_api_key] [client_id]
# If positional args are omitted it will prompt interactively.
# The script is idempotent: if a secret exists, it appends a new version; otherwise it creates it.

# --- Input handling ---------------------------------------------------------
USERNAME=${1-}
PASSWORD=${2-}
CUSTOMER_KEY_ARG=${3-}
PROJECT_ID=${4-"luknerlumina-firebase"}
CLIENT_ID_ARG=${6-}

# Internal API key generation: fifth arg overrides; otherwise generate a random 32-byte hex string.
if [[ -n "${5-}" ]]; then
  INTERNAL_API_KEY="$5"
else
  # openssl is available in CI runners and most dev machines
  INTERNAL_API_KEY=$(openssl rand -hex 32)
fi

# Determine CUSTOMER_KEY: use arg if given; otherwise fetch existing secret, else fallback default.
if [[ -n "$CUSTOMER_KEY_ARG" ]]; then
  CUSTOMER_KEY="$CUSTOMER_KEY_ARG"
else
  if gcloud secrets describe TEBRA_CUSTOMER_KEY --project="$PROJECT_ID" >/dev/null 2>&1; then
    CUSTOMER_KEY=$(gcloud secrets versions access latest --secret=TEBRA_CUSTOMER_KEY --project="$PROJECT_ID")
  else
    CUSTOMER_KEY="j57wt68dc39q"  # default constant
  fi
fi

if [[ -z "$USERNAME" ]]; then
  read -rp "Enter Tebra username: " USERNAME
fi
if [[ -z "$PASSWORD" ]]; then
  read -srp "Enter Tebra password: " PASSWORD
  echo
fi

WSDL_URL="https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey=${CUSTOMER_KEY}"
SERVICE_ACCOUNT="tebra-cloud-run-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# --- Helper: create or add version -----------------------------------------
ensure_secret() {
  local secret_name="$1"; shift
  local secret_value="$1"; shift

  if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "Adding new version to existing secret $secret_name"
    printf "%s" "$secret_value" | gcloud secrets versions add "$secret_name" \
      --project="$PROJECT_ID" --data-file=- >/dev/null
  else
    echo "Creating secret $secret_name"
    printf "%s" "$secret_value" | gcloud secrets create "$secret_name" \
      --project="$PROJECT_ID" --replication-policy="automatic" --data-file=- >/dev/null
  fi

  # Ensure the Cloud-Run service account can access it
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" >/dev/null || true
}

# --- Main ------------------------------------------------------------------

echo "\n⏳ Updating secrets in Google Secret Manager (project: $PROJECT_ID) …"

ensure_secret "TEBRA_USERNAME" "$USERNAME"
ensure_secret "VITE_TEBRA_USERNAME" "$USERNAME"

# TEBRA_CLIENT_ID rarely changes (e.g., practice ID 67149). Update only if explicit arg provided or secret missing.
if [[ -n "$CLIENT_ID_ARG" ]]; then
  ensure_secret "TEBRA_CLIENT_ID" "$CLIENT_ID_ARG"
else
  if ! gcloud secrets describe TEBRA_CLIENT_ID --project="$PROJECT_ID" >/dev/null 2>&1; then
    ensure_secret "TEBRA_CLIENT_ID" "67149"
  fi
fi

ensure_secret "TEBRA_PASSWORD" "$PASSWORD"
ensure_secret "VITE_TEBRA_PASSWORD" "$PASSWORD"   # keep Vite secret in sync
ensure_secret "TEBRA_CUSTOMER_KEY" "$CUSTOMER_KEY"
ensure_secret "tebra-wsdl-url" "$WSDL_URL"

# Internal API key
ensure_secret "tebra-internal-api-key" "$INTERNAL_API_KEY"

echo "\n✅ Secrets updated successfully. Remember to redeploy any Cloud services that cache secrets."

echo "🔑 Generated/updated tebra-internal-api-key: $INTERNAL_API_KEY"