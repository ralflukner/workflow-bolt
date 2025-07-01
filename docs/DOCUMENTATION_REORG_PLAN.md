# Documentation Re-organisation & Cleanup Plan

_Last updated: 2025-06-23 14:32 EDT_

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

## 4. Implementation Road-Map (2025)

| Phase | Goal | ETA | Status |
|-------|------|-----|--------|
| 0 | Discovery / full inventory | 2025-06-22 | ✅ done |
| 1 | Create canonical structure & new overview | 2025-06-23 (AM) | ✅ done |
| 2 | Bulk relocation / cross-link fix-ups | 2025-06-24 | ⏳ in-progress |
| 3 | Content refresh & gap analysis | 2025-06-26 | 🔜 not-started |
| 4 | Automation (lint, link-check, pre-commit) | 2025-06-28 | 🔜 not-started |
| 5 | Version bump & changelog publish | 2025-06-28 | 🔜 not-started |

### Phase Details

**Phase 0 – Discovery**
• Enumerate all files in `docs/` with scripts/inventory-docs.js  
• Tag by audience & topic; output saved to `docs/_reports/inventory-2025-06-22.json`.

**Phase 1 – Skeleton**
• `00-overview/overview.md` rewritten.  
• Standard directory map enforced.  
• Old overview text removed.

**Phase 2 – Relocation (CURRENT)**
A. Move remaining root-level docs into their homes (list maintained in Tracking table below).  
B. Run `npm run docs:fix-links` to rewrite relative links.  
C. Commit hashes logged.

**Phase 3 – Content refresh** … *(see previous assistant message for bullets)*

**Phase 4 – Automation** …

**Phase 5 – Publish & tag**

## 5. Progress Log (chronological)

_Standard format: `YYYY-MM-DD HH:MM TZ – message – author`_

| Timestamp | Author | Note |
|-----------|--------|------|
| 2025-06-23 14:45 EDT | @ralf | Added Encryption redesign roadmap; CHANGES_SUMMARY entry; progress tracker clarified. |
| 2025-06-23 14:32 EDT | @ralf | Phase 1 finished; Phase 2 started (moved recommendation.md & startup-issue doc). |
| 2025-06-22 17:10 EDT | @ralf | Completed Phase 0 inventory script. |

*(please append newest rows at top)*

## 6. How to update this tracker
1. Edit **this file** in your PR.  
2. Update "Last updated" stamp at top.  
3. Add a one-line entry to **Progress Log**.  
4. If a phase status changes, update the table above.  
5. CI will fail if timestamp format is invalid (regex check in `.github/workflows/docs-lint.yml`).

## 7. SemVer & Release tagging
When Phase 5 completes we will bump **package.json** from `0.1.0` → `0.1.1-docs` (or `0.2.0` if any breaking config change) and tag the commit `v0.1.1-docs`.

## 8. Immediate Next Steps

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

### Appendix C – Tool / Framework Recommendations (2025-06-23)

> These notes were added as part of the ongoing project-management log so future contributors can quickly locate vetted third-party resources that align with the app's HIPAA and reliability goals.

### 🔐 Enhancing Security & Secret Management
1. **Google Cloud Secret Manager** – preferred over Firebase env API; provides fine-grained IAM, audit logs, versioning.
2. **Virgil Security E3Kit** – client-side end-to-end encryption demonstration (see Virgil's Firebase chat demo) – useful reference for HIPAA-grade crypto.

### 🧪 Improving Testing & Dev Workflow
1. **oclif** – adopt for a headless CLI so tests interact with business logic not DOM.  Use `oclif/plugin-test` for Jest helpers.
2. **Firebase Emulator Suite** – run Firestore, Functions & Auth locally; essential for CI and for testing security rules.

### 🏥 Reference HIPAA Implementations
1. **Parse-HIPAA** – Parse Server fork with auditing & encrypted storage (HIPAA/GDPR).  Good pattern for backend hardening.
2. **Curelia Health** – open-source healthcare platform on GCP (Cloud Run, Cloud SQL, KMS) – demonstrates infra best-practices.

### 📌 Summary
• Secrets → migrate to GSM.  
• Encryption → E3Kit-style end-to-end.  
• Testing → oclif CLI + Firebase emulators.  
• Study Parse-HIPAA & Curelia for architecture inspiration.

### 🛠 Open-source Parsing Tools (cost-free)
• **MegaParse** – Apache 2.0; high-speed multi-format parser (text, PDF, Office).  
• **Parsr** – MIT; converts PDF/images to structured JSON/Markdown/CSV, includes OCR.  
• **oclif** – MIT; Node/TS CLI framework (used by Salesforce, Heroku).

_Feel free to expand this list as new tooling decisions are made._

---

_End of plan_
