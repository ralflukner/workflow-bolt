# Code Review Action Plan

This document outlines a prioritized plan to address the findings from the code review. The plan is divided into phases, starting with the most critical issues.

## Phase 1: Immediate Security & Build Stability

**Objective**: Address critical security vulnerabilities and fix the TypeScript errors that are likely causing build failures.

**Key Tasks**:

1.  **Remove Unauthenticated Access**:
    *   **Issue**: The `deploy_with_retry.sh` script uses the `--allow-unauthenticated` flag, which is a major security risk.
    *   **Action**: Modify the script to remove this flag. Implement IAM-based authentication for Cloud Functions, ensuring that only authorized services or users can invoke them.

2.  **Secure CI/CD Authentication**:
    *   **Issue**: The `security-check.yml` workflow uses a long-lived service account key (`GCP_SA_KEY`) stored as a GitHub secret.
    *   **Action**: Update the workflow to use OIDC/Workload Identity for authentication to Google Cloud. This will eliminate the need for long-lived keys.

3.  **Address PHI Exposure**:
    *   **Issue**: The codebase contains potential hard-coded PHI in logs and test data.
    *   **Action**: Conduct a thorough audit of the codebase to identify and remove all instances of hard-coded PHI. Implement data masking or redaction for logs and use non-sensitive data for tests.

4.  **Fix TypeScript Errors**:
    *   **Issue**: There are 36 TypeScript errors across multiple files, preventing the application from building and running reliably.
    *   **Action**: Address all TypeScript errors, starting with those in `tebraDebugApi.ts` and `tebra-connection-debug.ts`, as they appear to be the most critical.

## Phase 2: Core Infrastructure & CI/CD

**Objective**: Fill in the gaps in core operational scripts and automate the deployment process.

**Key Tasks**:

1.  **Create Missing Scripts**:
    *   **Issue**: The `health_dashboard.sh` and `safe_rollback.sh` scripts are missing.
    *   **Action**: Implement these scripts to provide essential operational capabilities for monitoring the health of functions and rolling back failed deployments.

2.  **Automate Deployments**:
    *   **Issue**: There is no `deploy.yml` workflow for automated deployments.
    *   **Action**: Create a new GitHub workflow to automate the deployment of Cloud Functions. This workflow should be triggered on merges to the `main` branch and should include steps for testing, linting, and secure deployment.

3.  **Dependency Vulnerability Scanning**:
    *   **Issue**: There is no automated way to check for vulnerable dependencies.
    *   **Action**: Integrate a tool like `pip-audit` or `safety` into the CI/CD pipeline to scan for known vulnerabilities in Python dependencies.

4.  **Establish HIPAA Compliance Baseline**:
    *   **Issue**: There is no standardized approach to HIPAA compliance for new functions.
    *   **Action**: Create a `hipaa_function` Terraform module that enforces necessary security controls (e.g., audit logging, CMEK, IAM expiry). Create a `hipaa-enforcement.sentinel` policy to enforce these controls.

## Phase 3: Code Quality & Best Practices

**Objective**: Improve the overall quality, maintainability, and resilience of the codebase.

**Key Tasks**:

1.  **Implement Health Checks**:
    *   **Issue**: The Cloud Functions do not have `/health` endpoints.
    *   **Action**: Add a `/health` endpoint to each Cloud Function that returns a `{status: 'ok'}` response. This will allow for proper health monitoring.

2.  **Add Code Coverage Reporting**:
    *   **Issue**: The test suite does not report code coverage.
    *   **Action**: Configure `pytest-cov` to generate a coverage report and fail the build if coverage falls below a reasonable threshold (e.g., 80%).

3.  **Enforce Code Style**:
    *   **Issue**: The `.pre-commit-config.yaml` file is missing.
    *   **Action**: Create this file and configure it with hooks for `black`, `isort`, and `flake8` to automatically enforce code style and quality.

4.  **Improve Input Validation**:
    *   **Issue**: The input validation in `patient_sync/main.py` is basic.
    *   **Action**: Enhance the validation logic to be more exhaustive, checking for correct data types, formats, and ranges.

## Phase 4: Documentation & Final Polish

**Objective**: Address remaining low-priority items and improve project documentation.

**Key Tasks**:

1.  **Document Structured Logging**:
    *   **Issue**: The format for structured logs is not clearly defined.
    *   **Action**: Create documentation that specifies the standard format for structured logs, including the required fields and their data types.

2.  **Optimize Resource Allocation**:
    *   **Issue**: Cloud Run and Cloud Functions may be over-provisioned.
    *   **Action**: Analyze resource utilization metrics in Google Cloud and adjust memory and CPU allocations to be more cost-effective.

3.  **Address Minor Issues**:
    *   **Action**: Work through any remaining low-priority issues from the code review, such as adding a `check-deps` target to the `Makefile`.
