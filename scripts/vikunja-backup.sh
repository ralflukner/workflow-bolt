#!/usr/bin/env bash
# scripts/vikunja-backup.sh
# ---------------------------------------------------------------------------
# Docker-host backup for the self-hosted Vikunja stack.
#  • Dumps Postgres
#  • Archives the uploads volume
#  • Uploads both artefacts to a versioned folder in a GCS bucket
#  • Intended to be run from cron on the same machine that hosts docker-compose
# ---------------------------------------------------------------------------
# USAGE (manual):
#   ./scripts/vikunja-backup.sh
#
# Recommended cron entry (daily 02:30 UTC):
#   30 2 * * * /path/to/workflow-bolt/scripts/vikunja-backup.sh >> /var/log/vikunja-backup.log 2>&1
#
# REQUIREMENTS
#   • docker CLI (host must run Vikunja containers)
#   • gcloud CLI authenticated (or service-account key JSON)
#   • Service-account vikunja-backup-sa with roles/storage.objectAdmin on the project
# ---------------------------------------------------------------------------
set -euo pipefail

# ---------- CONFIG ----------------------------------------------------------
PROJECT_ID="luknerlumina-firebase"
BUCKET="vikunja-backups"
# Path to SA key json. Leave empty to use gcloud's current credentials.
SA_KEY_JSON="$HOME/secrets/vikunja-backup-key.json"
DB_CONTAINER="workflow-bolt-vikunja-db-1"
UPLOADS_VOLUME="workflow-bolt_uploads"
RETENTION_DAYS=30  # lifecycle rule applied once via `gsutil lifecycle set`
# ---------------------------------------------------------------------------

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
WORKDIR=$(mktemp -d /tmp/vikunja-backup-XXXX)
trap 'rm -rf "$WORKDIR"' EXIT

log() { echo "[$(date -u +%FT%T)] $*"; }

log "Dumping Postgres database…"
docker exec "$DB_CONTAINER" pg_dump -U vikunja vikunja | gzip -9 > "$WORKDIR/db.sql.gz"

log "Archiving uploads volume…"
docker run --rm -v "$UPLOADS_VOLUME":/data -v "$WORKDIR":/backup ubuntu \
  tar -czf /backup/uploads.tar.gz -C /data .

log "Authenticating to GCP…"
if [[ -f "$SA_KEY_JSON" ]]; then
  gcloud auth activate-service-account --key-file="$SA_KEY_JSON" --quiet
fi
gcloud config set project "$PROJECT_ID" --quiet

log "Uploading backups to gs://$BUCKET/$TIMESTAMP/"
 gsutil -q cp "$WORKDIR"/*.gz "gs://$BUCKET/$TIMESTAMP/"

log "Backup complete. Objects:"
gsutil ls -l "gs://$BUCKET/$TIMESTAMP/" | sed 's/^/    /'

log "✅ Vikunja backup finished successfully." 