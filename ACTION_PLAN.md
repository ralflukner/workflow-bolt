# Code Review Action Plan

This document outlines a prioritized plan to address the findings from the code review. The plan is divided into phases, starting with the most critical issues.

## Phase 1: Immediate Security & Build Stability

**Objective**: Address critical security vulnerabilities and fix the TypeScript errors that are likely causing build failures.

**Key Tasks**:

1. **Remove Unauthenticated Access**:
    * **Issue**: The `deploy_with_retry.sh` script uses the `--allow-unauthenticated` flag, which is a major security risk.
    * **Action**: Modified the script to remove this flag. Implement IAM-based authentication for Cloud Functions, ensuring that only authorized services or users can invoke them.
    * **Status**: ✅ RESOLVED (2025-01-05)

2. **Secure CI/CD Authentication**:
    * **Issue**: The `security-check.yml` workflow uses a long-lived service account key (`GCP_SA_KEY`) stored as a GitHub secret.
    * **Action**: Update the workflow to use OIDC/Workload Identity for authentication to Google Cloud. This will eliminate the need for long-lived keys.
    * **Status**: ✅ RESOLVED (2025-07-05)

3. **Address PHI in Source Code**:
    * **Issue**: The codebase contains potential hard-coded PHI in logs and test data.
    * **Action**: Conduct a thorough audit of the codebase to identify and remove all instances of hard-coded PHI. Implement data masking or redaction for logs and use non-sensitive data for tests.
    * **Status**: ✅ RESOLVED (2025-07-05)

4. **Fix TypeScript Errors (Initial)**:
    * **Issue**: Initial TypeScript errors were blocking builds.
    * **Action**: Addressed initial TypeScript errors in `src/components/Dashboard.tsx`, `src/cli/commands/sync-today-debug.ts`, and `src/services/tebraDebugApi.ts`.
    * **Status**: ✅ RESOLVED (2025-07-05)

## Phase 1.5: Test Failures & Repair (Due: 2025-01-11)

**Objective:** Achieve a green test suite and stable build by repairing all failing tests and addressing root causes.

**Key Tasks:**

1. **Triage All Test Failures**
    * **Owner:** QA Lead
    * **Due:** 2025-01-07
    * **Action:** Review CODE_REVIEW_RESULTS.md section 9, categorize failures by type (assertion, missing mock, OOM, etc.), and assign owners.
    * **Status**: ⬜ PENDING

2. **Clean Up Test Data**
    * **Owner:** Security Team
    * **Due:** 2025-01-08
    * **Action:** Remove PHI from all test data, replace with synthetic data, and implement data masking in logs.
    * **Status**: ✅ RESOLVED (2025-07-05) - *Note: This was part of Phase 1.3, but is also a key part of test stability.*

3. **Fix Undefined Variables & Add Missing Mocks**
    * **Owner:** Backend Team
    * **Due:** 2025-01-09
    * **Action:** Define all variables, add mocks for dependencies (e.g., BrowserController, megaParseSchedule.js).
    * **Status**: ⬜ PENDING

4. **Resolve Module Not Found Errors**
    * **Owner:** Backend Team
    * **Due:** 2025-01-09
    * **Action:** Update imports, add missing files, and ensure all modules are available for tests.
    * **Status**: ⬜ PENDING

5. **Address Heap Out of Memory & Timeouts**
    * **Owner:** QA Lead
    * **Due:** 2025-01-10
    * **Action:** Split large tests, increase Jest memory limit, and adjust timeouts for long-running tests.
    * **Status**: ⬜ PENDING

6. **Update Test Assertions**
    * **Owner:** Backend Team
    * **Due:** 2025-01-10
    * **Action:** Ensure all test assertions match actual function output and error messages.
    * **Status**: ⬜ PENDING

7. **Document All Fixes**
    * **Owner:** All
    * **Due:** Ongoing
    * **Action:** Cross-reference PRs and commits in CODE_REVIEW_RESULTS.md section 9.
    * **Status**: ⬜ PENDING

**Success Criteria (Phase 1.5):**

* [ ] All TypeScript test suites pass (unit, integration, e2e)
* [ ] No PHI in test data or logs
* [ ] No module not found or undefined variable errors
* [ ] No heap out of memory or timeout errors
* [ ] All fixes documented and cross-referenced

## Phase 2: Core Infrastructure & CI/CD

**Objective**: Fill in the gaps in core operational scripts and automate the deployment process.

**Key Tasks**:

1. **Create Missing Scripts**:
    * **Issue**: The `health_dashboard.sh` and `safe_rollback.sh` scripts are missing.
    * **Action**: Implement these scripts to provide essential operational capabilities for monitoring the health of functions and rolling back failed deployments.
    * **Status**: ✅ RESOLVED (2025-07-05) - *Placeholders created.*

2. **Automate Deployments**:
    * **Issue**: There is no `deploy.yml` workflow for automated deployments.
    * **Action**: Create a new GitHub workflow to automate the deployment of Cloud Functions. This workflow should be triggered on merges to the `main` branch and should include steps for testing, linting, and secure deployment.
    * **Status**: ⬜ PENDING

3. **Dependency Vulnerability Scanning**:
    * **Issue**: There is no automated way to check for vulnerable dependencies.
    * **Action**: Integrate a tool like `pip-audit` or `safety` into the CI/CD pipeline to scan for known vulnerabilities in Python dependencies.
    * **Status**: ⬜ PENDING

4. **Establish HIPAA Compliance Baseline**:
    * **Issue**: There is no standardized approach to HIPAA compliance for new functions.
    * **Action**: Create a `hipaa_function` Terraform module that enforces necessary security controls (e.g., audit logging, CMEK, IAM expiry). Create a `hipaa-enforcement.sentinel` policy to enforce these controls.
    * **Status**: ⬜ PENDING

## Phase 3: Code Quality & Best Practices

**Objective**: Improve the overall quality, maintainability, and resilience of the codebase.

**Key Tasks**:

1. **Implement Health Checks**:
    * **Issue**: The Cloud Functions do not have `/health` endpoints.
    * **Action**: Add a `/health` endpoint to each Cloud Function that returns a `{status: 'ok'}` response. This will allow for proper health monitoring.
    * **Status**: ⬜ PENDING

2. **Add Code Coverage Reporting**:
    * **Issue**: The test suite does not report code coverage.
    * **Action**: Configure `pytest-cov` to generate a coverage report and fail the build if coverage falls below a reasonable threshold (e.g., 80%).
    * **Status**: ⬜ PENDING

3. **Enforce Code Style**:
    * **Issue**: The `.pre-commit-config.yaml` file is missing.
    * **Action**: Create this file and configure it with hooks for `black`, `isort`, and `flake8` to automatically enforce code style and quality.
    * **Status**: ⬜ PENDING

4. **Improve Input Validation**:
    * **Issue**: The input validation in `patient_sync/main.py` is basic.
    * **Action**: Enhance the validation logic to be more exhaustive, checking for correct data types, formats, and ranges.
    * **Status**: ⬜ PENDING

## Phase 4: Documentation & Final Polish

**Objective**: Address remaining low-priority items and improve project documentation.

**Key Tasks**:

1. **Document Structured Logging**:
    * **Issue**: The format for structured logs is not clearly defined.
    * **Action**: Create documentation that specifies the standard format for structured logs, including the required fields and their data types.
    * **Status**: ⬜ PENDING

2. **Optimize Resource Allocation**:
    * **Issue**: Cloud Run and Cloud Functions may be over-provisioned.
    * **Action**: Analyze resource utilization metrics in Google Cloud and adjust memory and CPU allocations to be more cost-effective.
    * **Status**: ⬜ PENDING

3. **Address Minor Issues**:
    * **Action**: Work through any remaining low-priority issues from the code review, such as adding a `check-deps` target to the `Makefile`.
    * **Status**: ⬜ PENDING
