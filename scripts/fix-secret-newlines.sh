#!/opt/homebrew/bin/bash
# fix-secret-newlines.sh
# ---------------------------------------------------------------------------
# Removes trailing newline characters from **all** Google Secret Manager
# secrets in the active project (or $GCLOUD_PROJECT).  Skips secrets whose
# latest version already has no newline.  Adds a new version with the cleaned
# value; does NOT destroy existing versions (retains history).
# ---------------------------------------------------------------------------
set -euo pipefail

PROJECT="${GCLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
if [[ -z "$PROJECT" ]]; then
  echo "❌ Could not determine project. Set GCLOUD_PROJECT or run 'gcloud config set project'." >&2
  exit 1
fi

echo "🔍 Scanning secrets in project: $PROJECT"
TOTAL=0; FIXED=0; SKIPPED=0

trim_newline() {
  # Reads stdin, strips ONE trailing \n if present, outputs to stdout
  perl -pe 'chomp if eof'
}

while read -r SECRET_ID; do
  TOTAL=$((TOTAL+1))

  # Determine if the latest version ends with a newline WITHOUT using command
  # substitution (because that strips trailing \n).  We stream the secret value
  # into the pipeline so we can inspect the final byte.
  if gcloud secrets versions access latest \
       --secret="$SECRET_ID" \
       --project="$PROJECT" 2>/dev/null | \
       tail -c1 | od -An -t x1 | tr -d ' ' | grep -q '^0a$'; then
    echo "✂️  $SECRET_ID : newline detected – fixing…"

    # Stream the value again, strip the single trailing newline, and upload as a
    # new secret version. Using pipelines preserves the original byte-for-byte
    # content (except the final \n we intentionally remove).
    gcloud secrets versions access latest \
      --secret="$SECRET_ID" \
      --project="$PROJECT" 2>/dev/null | \
      trim_newline | \
      gcloud secrets versions add "$SECRET_ID" \
        --project="$PROJECT" \
        --data-file=- >/dev/null

    FIXED=$((FIXED+1))
  else
    SKIPPED=$((SKIPPED+1))
  fi
done < <(gcloud secrets list --format="value(name)" --project="$PROJECT")

echo "---"
echo "Processed : $TOTAL"
echo "Fixed     : $FIXED"
echo "Untouched : $SKIPPED" 