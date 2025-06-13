#!/usr/bin/env bash

# =====================================================================================
# git-cleanup.sh
# -------------------------------------------------------------------------------------
# Permanently remove sensitive files & strings from the entire Git history, then push
# the cleaned history to a new remote (or force-push to the current one).
#
# ⚠  WARNING:  This rewrites history.  Everyone must re-clone afterwards.
# =====================================================================================

set -euo pipefail
IFS=$'\n\t'

# ------------------------------
# 0. Configuration  ✏️  EDIT ME
# ------------------------------
FILES_TO_PURGE=(
  "test-tebra-debug.php"
  "test-tebra-appointments.php"
  "test-practice-67149.php"
  "test-utc-format.php"
  "test-api-spec.php"
  "test-soap-xml-debug.php"
  "test-june-10.php"
  "check-practice-id.php"
  "php/tebra-test-with-trait.php"
)

# Secrets to scrub (pattern ==> replacement)
read -r -d '' REPLACE_MAP <<'EOF'
work-flow@luknerclinic.com==>REMOVED
Y2ISY-x@mf1B4renpKHV3w49==>REMOVED
j57wt68dc39q==>REMOVED
EOF

# New remote to push to (create an empty private repo first)
NEW_REMOTE_URL="git@github.com:YOUR-ORG/workflow-bolt-clean.git"

# Uncomment the next line to force-push back to the same remote instead
# NEW_REMOTE_URL="origin"

# ------------------------------
# 1. Preconditions & setup
# ------------------------------
command -v git-filter-repo >/dev/null 2>&1 || {
  echo "❌ git-filter-repo not found. Install it first (brew install git-filter-repo)." >&2
  exit 1
}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
TEMP_MIRROR="$REPO_ROOT/../workflow-bolt-clean.git"

if [ -d "$TEMP_MIRROR" ]; then
  echo "⚠️  Removing existing temporary mirror $TEMP_MIRROR"
  rm -rf "$TEMP_MIRROR"
fi

# ------------------------------
# 2. Clone a bare mirror
# ------------------------------
cd "$REPO_ROOT/.."

echo "🚀 Creating bare mirror ..."

git clone --mirror "$REPO_ROOT" "$TEMP_MIRROR"
cd "$TEMP_MIRROR"

echo "✅ Mirror ready at $TEMP_MIRROR"

# ------------------------------
# 3. Remove files from history
# ------------------------------
FILTER_PATH_ARGS=()
for f in "${FILES_TO_PURGE[@]}"; do
  FILTER_PATH_ARGS+=(--path "$f")
done

echo "🧹 Purging file paths..."

git filter-repo "${FILTER_PATH_ARGS[@]}" --invert-paths --force

echo "✅ File paths removed"

# ------------------------------
# 4. Replace sensitive strings
# ------------------------------
TMP_TXT=$(mktemp)
echo "$REPLACE_MAP" > "$TMP_TXT"

echo "🔒 Scrubbing secrets..."

git filter-repo --replace-text "$TMP_TXT" --force
rm "$TMP_TXT"

echo "✅ Secrets scrubbed"

# ------------------------------
# 5. Push cleaned history
# ------------------------------

echo "🚀 Pushing cleaned history to $NEW_REMOTE_URL ..."

git remote remove origin || true
git remote add origin "$NEW_REMOTE_URL"
git push --force --all origin
if git show-ref --tags | grep -q .; then
  git push --force --tags origin
fi

echo "🎉 Finished. Clean repo pushed."

echo "⚠️  ACTION REQUIRED: Ask every collaborator to re-clone from $NEW_REMOTE_URL" 