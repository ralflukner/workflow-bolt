#!/usr/bin/env bash
# scripts/docs-scaffold.sh
# -------------------------------------------------------------
# Phase-1 helper: scaffold the new documentation tree proposed
# in `docs/documentation-reorg-plan.md`.
#
# Running this script will:
# 1. Create the numbered section directories under docs/.
# 2. Add a placeholder README.md to each so Git tracks them.
# -------------------------------------------------------------
set -euo pipefail

DOC_ROOT="$(git rev-parse --show-toplevel)/docs"
SECTIONS=(
  "00-overview"
  "01-compliance"
  "02-infrastructure"
  "03-application"
  "04-ops"
  "05-governance"
)

for section in "${SECTIONS[@]}"; do
  dir="${DOC_ROOT}/${section}"
  if [[ ! -d "${dir}" ]]; then
    echo "Creating ${dir}"
    mkdir -p "${dir}"
  fi

  readme="${dir}/README.md"
  if [[ ! -f "${readme}" ]]; then
    echo "# ${section#??-} (placeholder)\n\n> TODO: replace this stub with real content in later phases." > "${readme}"
    echo "  • Added ${readme}"
  fi

done

echo "\nScaffold complete ✔"
