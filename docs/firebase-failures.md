# Firebase Integration – Failure Catalogue & Remediation Plan

*Last updated: 2025-06-15*

> **Scope**
> This document captures every known failure mode we have encountered while integrating with **Firebase services** including Functions, Authentication, Secret Manager, and App Check. It references the exact code paths, describes what currently works vs. what is broken, and tracks resolutions / open items.

---

## 1. Architecture Quick-View

```mermaid
flowchart LR
  subgraph Frontend (React)
    UI[UI Components]
    SDK[Firebase SDK]
  end
  subgraph Firebase Services
    AUTH[Authentication]
    FUNC[Cloud Functions]
    SM[Secret Manager]
    AC[App Check]
  end
  subgraph Backend Services
    CR[Cloud Run]
    GCP[GCP APIs]
  end

  UI --> SDK
  SDK --> AUTH
  SDK --> FUNC
  FUNC --> SM
  FUNC --> CR
  AUTH --> AC
  SM --> GCP
```

**Key repos / files**

- Firebase Functions entry-points – `functions/index.js` (Node 22)
- Firebase configuration – `src/config/firebase-config.ts`
- Authentication service – `src/services/firebaseConfigService.ts`
- Secret management – `functions/src/get-secret.ts`
- App Check test script – `test-functions-secure.js`

---

## 2. Failure Log

| Date (UTC) | Component | Symptom | Root cause | Status |
|------------|-----------|---------|-----------|--------|
| **2025-06-15** | App Check | Functions blocked with missing `X-Firebase-AppCheck` header | Test script didn't include App Check token | **Fixed** – added App Check token generation in test script |
| **2025-06-15** | Authentication | Custom token in Authorization header causes 401 | Test script sent custom token instead of ID token | **Fixed** – exchange custom token for ID token using client SDK |
| **2025-06-15** | Storage Bucket | Runtime 404 errors from invalid bucket URL | storageBucket used `.firebasestorage.app` instead of `.appspot.com` | **Fixed** – corrected bucket URL format |
| **2025-06-14** | Secret Manager | Multiple parallel GSM calls during cold starts | No shared initialization promise | **Fixed** – implemented shared promise pattern |
| **2025-06-13** | Functions Init | Race condition with Functions not initialized | Non-null assertion on potentially undefined functions | **Fixed** – added initialization check helper |
| **2025-06-12** | Config Service | 7 separate network calls for Firebase config | Each secret fetched individually | **Fixed** – replaced with single getFirebaseConfig call |
| **2025-06-11** | Build Process | TypeScript compilation errors during deploy | Unused imports and type mismatches | **Fixed** – cleaned up imports and fixed types |
| **2025-06-15** | Test Runner | `AuthBridge Integration Tests` fail when un-skipped (`onAuthStateChanged` mock missing) | Jest mocks for `firebase/auth` outdated | **Open** – update mocks or move to e2e test harness |

---

## 3. What Currently Works

1. `getFirebaseConfig` callable – successfully returns complete Firebase configuration from Secret Manager.
2. `getSecret` callable – securely retrieves whitelisted secrets with proper authentication.
3. Authentication flow – ID token generation and validation working correctly.
4. App Check integration – tokens generated and validated properly.
5. Secret Manager caching – shared initialization prevents redundant API calls.
6. Functions deployment – all TypeScript functions compile and deploy successfully.

---

## 4. Known Issues / Partial Failures

| ID | Area | Description | Severity | Owner | Ticket |
|----|------|-------------|----------|-------|--------|
| F-01 | Cold Starts | Functions occasionally timeout on first invocation after deploy | MED | DevOps | GH issue #92 |
| F-02 | Auth Tokens | ID tokens expire during long-running operations | LOW | Frontend | GH issue #88 |
| F-03 | Error Handling | Generic error messages don't provide debugging context | MED | Backend | GH issue #89 |
| F-04 | Local Dev | Firebase emulator inconsistent with production behavior | LOW | DevOps | – |
| F-05 | Test Coverage | `AuthBridge Integration Tests` currently skipped; mocks need overhaul to pass | LOW | QA | GH issue #95 |

---

## 5. Remediation & Roadmap

### Completed

- Fixed App Check token generation in test scripts (commit `feature/tebra-api-proxy`).
- Implemented proper ID token exchange for authentication.
- Corrected Firebase Storage bucket URL format.
- Added shared initialization promise for Secret Manager calls.
- Cleaned up TypeScript compilation issues.

### In Flight (June to July 2025)

1. **Cold Start Optimization** – Implement keep-warm functions and optimize bundle size.
2. **Token Refresh** – Add automatic ID token refresh in long-running operations.
3. **Enhanced Logging** – Add structured logging with correlation IDs for better debugging.
4. **Emulator Parity** – Align local emulator configuration with production settings.

### Backlog

- Implement Firebase Performance Monitoring for better observability.
- Add Firebase Remote Config for feature flags and configuration management.
- Set up Firebase Crashlytics for error tracking in production.
- Migrate remaining hardcoded configurations to Firebase Remote Config.

---

## 6. How to Reproduce & Troubleshoot Common Failures

### 6.1 App Check Token Missing

```bash
# Test with proper App Check token
node test-functions-secure.js
# OR check App Check configuration in Firebase Console
```

Ensure the App Check token is included in the `X-Firebase-AppCheck` header for all function calls.

### 6.2 Authentication 401 Errors

1. Verify user is properly authenticated with Firebase Auth.
2. Check that ID token (not custom token) is being sent.
3. Validate token hasn't expired (default 1 hour).

### 6.3 Secret Manager Access Denied

```bash
# Check IAM permissions
gcloud projects get-iam-policy luknerlumina-firebase
# Verify service account has Secret Manager Secret Accessor role
```

### 6.4 Functions Initialization Race Condition

Look for error: "Firebase Functions not initialized"

- Ensure Firebase is initialized before calling functions
- Use the `getFunctionsInstance()` helper to validate initialization

---

## 7. References

- **Firebase Console** – [luknerlumina-firebase](https://console.firebase.google.com/project/luknerlumina-firebase)
- **Functions Documentation** – `docs/tebra-functions-usage.md`
- **Authentication Setup** – `src/auth/AuthProvider.tsx`
- **Secret Management Guide** – `functions/src/get-secret.ts`
