# 📚 Documentation Index

Welcome to the **workflow-bolt** documentation set.  Everything is grouped by lifecycle so humans _and_ AI agents can locate information quickly.

| Section | Purpose |
|---------|---------|
| `00-overview/` | High-level architecture diagrams & summaries |
| `01-compliance/` | HIPAA, security, audit, and legal artefacts |
| `02-infrastructure/` | Cloud Run, Firebase, Terraform, deployments |
| `03-application/` | React front-end, Firebase Functions, PHP proxy |
| `04-ops/` | Run-books, incident reports, troubleshooting guides |
| `05-governance/` | Coding standards, versioning, change-management |

### 🔍 Quick Links

* [Ops ‑ Firebase Functions Startup Failure](04-ops/firebase-functions-startup-issue.md)
* [Compliance ‑ HIPAA Setup Guide](01-compliance/HIPAA_SETUP_GUIDE.md)
* [Infrastructure ‑ Cloud-Run design](02-infrastructure/tebra-cloudrun-design.md)
* [Governance ‑ Contribution Instructions](05-governance/instructions.md)
* [Overview ‑ Implementation Summary](00-overview/IMPLEMENTATION_SUMMARY.md)

> Tip: use the GitHub file finder (**`t`** key) and search by filename or heading.

---

## Recent Progress

* Successfully bootstrapped the Cloud Functions playbook v5.2.1
* Created and deployed the `tebra_debug` function with full test coverage and validation
* All steps were performed using the Makefile and scripts, with no manual gcloud commands

---

## Workflow Summary

1. Create a new function:
   ```bash
   make new NAME=my_function
   ```
2. Edit the function and its tests.
3. Ensure all dependencies are in both `requirements.txt` and `tests/requirements-dev.txt`.
4. Run tests:
   ```bash
   make test NAME=my_function
   ```
5. Deploy:
   ```bash
   make deploy NAME=my_function
   ```
6. Check logs and status:
   ```bash
   make logs NAME=my_function
   make status
   ```

---

## Next Steps

* Build and deploy `patient_sync` function
* Expand integration tests and monitoring
* Keep requirements files in sync for all functions
* Use the Makefile for all function operations

---

## Troubleshooting

* If you see `ModuleNotFoundError`, install the missing package in the shared venv and add it to both requirements files.
* Re-run `make test` after any dependency changes.

---

## Project Plan

* [x] Bootstrap and deploy tebra_debug
* [ ] Build patient_sync
* [ ] VPC verification for Redis access
* [ ] Centralize documentation
* [ ] Set up CI/CD
* [ ] Complete Redis queue architecture
* [ ] Add risk & issue log
* [ ] Confirm Gemini's design-doc ownership
* [ ] Create shared kanban board

---

## Canonical Workflow

* **Always use the Makefile** for creating, testing, deploying, and managing functions.
* Keep documentation and the project plan up to date as you progress.
