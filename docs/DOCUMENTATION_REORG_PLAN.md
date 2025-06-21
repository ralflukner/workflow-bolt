# Documentation Re-organisation & Cleanup Plan

_Last updated: <!-- TODO: keep updated --> 2025-06-19_

## 1. Executive Summary

The `docs/` folder has grown organically and now contains 130+ Markdown files, ad-hoc backups (`*.bak`), and overlapping topics.  This makes it hard for contributors to discover accurate, up-to-date guidance.

This plan proposes a **three-phase clean-up** that will:

1. Remove obsolete or duplicate artefacts
2. Re-structure content into clearly named sub-directories that map to the project's architecture / SDLC flow
3. Introduce lightweight progress-tracking so everyone knows what has been cleaned up and what is pending

## 2. Current Pain-Points

• Multiple versions of the same file (e.g. `HIPAA_SETUP_GUIDE.md` & `HIPAA_SETUP_GUIDE.md.bak`)
• Hard to know which Cloud Run URL / secret / config is current (API keys, etc.)
• No single source-of-truth for debugging steps – information is scattered across `tebra-api-failures.md`, `debug-*`, individual PR descriptions, etc.
• No living roadmap to track documentation improvements

## 3. Target Folder Structure

```
docs/
  00-overview/       # What, Why, Quick-links
  01-compliance/     # HIPAA, SOC-2, PHI, security
  02-infrastructure/ # Cloud Run, Firebase, GSM, networking
  03-application/    # Front-end, PHP API, TypeScript services
  04-ops/            # Monitoring, alerting, on-call run-books
  05-governance/     # Versioning, release process, RFCs
  _archive/          # Auto-moved legacy + .bak files (read-only)
  README.md          # Single index with ToC & search tips
  CHANGELOG.md       # Keep, but trim noise
```

_Note: folders already exist for `00-05`; the plan formally standardises their purpose._

## 4. Phased Approach

### Phase 1 – **Inventory & Archive**  (ETA ≤ 1 day)

1. Identify all `*.bak` and duplicated files – move to `docs/_archive/`
2. Create `docs/ARCHIVE_LOG.md` with a table listing each moved file & reason
3. Update root `docs/README.md` ToC to remove archived items

### Phase 2 – **Consolidate Key Topics**  (ETA ≈ 3 days)

1. Tebra PHP API authentication & debugging → merge into `02-infrastructure/tebra-php-api.md`
2. Firebase configuration guides → merge into `02-infrastructure/firebase-setup.md`
3. Debugging strategy + toolkit → consolidate into `04-ops/debugging-strategy.md`
4. Security checklists → unify under `01-compliance/`

### Phase 3 – **Progress Tracking & Automation**  (ongoing)

1. Create `docs/PROGRESS.md` _(auto-generated table described below)_
2. Add **GitHub Project board** "Docs Cleanup 2025" → track work items
3. Introduce `npm run docs:lint` (markdown-lint + link-checker) to CI

## 5. Progress Tracker Template (`docs/PROGRESS.md`)

| Area | Task | Owner | Status |
|------|------|-------|--------|
| Inventory | Move `*.bak` → _archive | @[initials] | ✅ Done |
| Overview  | Draft "Project at a glance" page | | 🔜 To-do |

(_maintainers update the table in PRs; CI can validate the status symbols_)

## 6. Immediate Next Steps

1. **Land this plan** (merge as `DOCUMENTATION_REORG_PLAN.md`)
2. Create `_archive/` folder & commit first wave of file moves via script (see below)
3. Open GitHub Project board with issues per Phase 1 task

---

### Appendix A – Shell helper to archive `*.bak`

```bash
bash scripts/archive-docs.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail
ARCHIVE="docs/_archive"
mkdir -p "$ARCHIVE"
# Move .bak files
find docs -type f -name '*.bak' | while read -r file; do
  git mv "$file" "$ARCHIVE/$(basename "$file")"
  echo "Moved $file"
done
```

_Commit the script, then run it once; manual review required for any collisions._

---

### Appendix B – Concise Summary of the Tebra PHP API Auth Debug Session (2025-06-19)

1. **Problem** – Front-end received 401 from Cloud Run service. Root cause: secret name mismatch (`TEBRA_INTERNAL_API_KEY` vs. `tebra-internal-api-key`) + stale revision.
2. **Fixes Applied**
   • Corrected secret value (including trailing `=`) in GSM
   • Updated service to reference **uppercase** secret; forced new revision
   • Standardised config in `src/services/configService.ts` to pull `import.meta.env.VITE_TEBRA_PROXY_API_KEY` and correct Cloud Run URL
3. **Outcome** – Service now authenticates correctly; next step is to consolidate these notes into `02-infrastructure/tebra-php-api.md`.

---

_End of plan_
