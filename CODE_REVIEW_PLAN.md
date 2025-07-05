### workflow-bolt — Targeted Code-Review Plan (v1)

This checklist is tuned for the current tech stack  
(Python 3.11 + GCP Cloud Functions Gen 2 + Make + Terraform + pytest).

────────────────────────────────  
1. Architecture & Design  
• Diagram end-to-end flow: triggering client → CF handler → Redis → downstream services.  
• Trace shared helpers (e.g. `templates/secure_http.py`) to ensure single-responsibility and no hidden coupling.  
• Confirm each function exposes a `/health` route and returns `{status}` contract.  
• Validate consistency of structured‐log fields (`event`, `trace_id`, `function`) across functions.

2. Build / Test Infrastructure  
• Walk through **Makefile** targets: verify `new / test / deploy / rollback / clean`.  
  – Ensure `_ensure-venv` installs `tests/requirements-dev.txt` once, not per-target.  
  – Spot missing dependency detection (`make check-deps`).  
• Inspect `scripts/*.sh` for `set -euo pipefail`, input validation, and shellcheck compliance.  
• Check test directory mirrors function names; assert ≥ 1 meaningful test per function.  
• Run `pytest --cov` – flag < 80 % coverage.

3. CI/CD & GitHub Workflows  
• `.github/workflows/deploy.yml`: confirm matrix matches `ci-lint` / `ci-deploy` in Makefile.  
• Verify OIDC workload-identity auth (no long-lived JSON keys).  
• Ensure terraform `plan` step runs with `-detailed-exitcode` for drift detection.  
• Confirm artefact caching for pip to keep build minutes low.

4. Cloud Functions Configuration  
• For each function, list: `memory`, `timeout`, `max-instances`, `ingress`.  
  – Cross-check against guidelines (256 MB, 60 s, 10, INTERNAL_AND_GCLB unless public).  
• Validate `serviceAccountEmail` points to dedicated SA; SA has least-privilege roles (`run.admin` w/ condition).  
• Ensure `vpcConnector` present on Redis-dependent handlers and region matches Memorystore.  
• Review environment variables: no secrets; values come from Secret Manager or KMS.

5. Dependencies & Supply-Chain  
• Run `pip-audit` (or Safety) on merged `requirements*.txt`; track CVEs.  
• Confirm `functions-framework` appears in every function’s `requirements.txt`.  
• Validate dev-time deps (pytest, flake8, black) stay in `tests/requirements-dev.txt` only.  
• Check `.pre-commit-config.yaml` hook list (black, isort, flake8, sentinel).

6. Security & Compliance (HIPAA focus)  
• Ensure HIPAA functions use `hipaa_function` Terraform module (audit bucket, CMEK, IAM expiry).  
• Scan code for hard-coded patient identifiers or PHI in logs.  
• Review input validation helpers `_validate_debug_payload` etc. for exhaustive field checks.  
• Confirm audit decorator logs `phi_access_logged` and bucket retention lock is **True**.  
• Check Sentinel policy (`hipaa-enforcement.sentinel`) is enforced in Terraform Cloud.

7. Observability & Cost  
• Verify `health_dashboard.sh` prints every ACTIVE function and status.  
• Confirm alert policies exist: error-rate > 5 %, latency P95, memory > 90 %.  
• Spot over-provisioned memory/instances; correlate with Cloud Billing to flag savings.  
• Ensure log-based metrics are excluded from default Logging bucket to control GB-ingest cost.

────────────────────────────────  
Deliverables

1. Filled-in review checklist (Google Doc or Markdown).  
2. Severity-ranked findings (Blocker / Major / Minor / Info).  
3. Recommended fixes or follow-up PR links.  
4. Cost summary delta if changes are applied.

This plan keeps the review aligned with the actual Python/Cloud-Functions stack while covering architecture, build, security, and cost angles in one concise pass.
