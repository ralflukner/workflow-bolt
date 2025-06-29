#!/opt/homebrew/bin/bash
# check-secret-newlines.sh
# Detect secrets whose latest version ends with a trailing newline

set -euo pipefail

PROJECT=${GCLOUD_PROJECT:-$(gcloud config get-value project)}

echo "🔍 Scanning secrets in project: $PROJECT"
printf '%-35s  %s\n' "Secret ID" "Ends with newline?"

gcloud secrets list --format="value(name)" |
while read -r SECRET; do
  if gcloud secrets versions access latest \
       --secret="$SECRET" --project="$PROJECT" 2>/dev/null |
       tail -c1 | hexdump -v -e '/1 "%02x"' | grep -q '^0a$'; then
    printf '%-35s  YES\n' "$SECRET"
  else
    printf '%-35s  no\n'  "$SECRET"
  fi
done