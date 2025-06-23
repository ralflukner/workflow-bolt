# HIPAA Security Audit – June 23 2025

## Overview

A rapid audit of **Firebase Cloud Functions** revealed several endpoints that accepted unauthenticated traffic – a direct HIPAA compliance violation.  Immediate hardening measures were applied to enforce Firebase-Auth bearer tokens on every API route and to remove obsolete test endpoints.

---

## 1  Issues Identified

| ID | Endpoint / File | Severity | Issue |
|----|-----------------|----------|-------|
| S-1 | `functions/index.js` – `exports.api` (Express app) | **Critical** | All `/api/*` routes were exposed via `onRequest` with **no authentication**. Attackers could invoke Tebra proxy and other helpers. |
| S-2 | Same Express app – `/test` GET & POST routes | High | Demo / test endpoints returned request bodies – potential PHI leakage. |
| S-3 | Callable `getFirebaseConfig` | Medium | Publicly accessible; could reveal restricted hostnames. (kept but now protected by Firebase-Auth) |
| S-4 | General | Medium | No unified error handling for auth failures – leaked stack traces. |

---

## 2  Repairs Implemented

| Fix ID | Description | Commit/PR |
|--------|-------------|-----------|
| F-1 | **Authentication middleware** added: `app.use('/api/*', authGuard)` verifying Firebase ID-token from `Authorization: Bearer <token>` header. | 26e7a70f |
| F-2 | Removed `/test` GET/POST routes. | ibid |
| F-3 | Updated error-handling middleware to return generic JSON on internal errors. | ibid |
| F-4 | Rate-limit (`express-rate-limit`) retained; now runs **after** auth guard to avoid leaking endpoint existence. | ibid |

Auth-guard snippet:

```js
app.use('/api/*', async (req, res, next) => {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Bearer ')) {
    return res.status(401).json({ success:false, error:'Auth required' });
  }
  try {
    req.user = await admin.auth().verifyIdToken(hdr.split(' ')[1]);
    next();
  } catch (e) {
    return res.status(401).json({ success:false, error:'Invalid token' });
  }
});
```

---

## 3  Deployment & Verification

1. `firebase deploy --only functions` – revision `api@v2.3.1` now live.
2. Post-deploy tests:
   * Unauthenticated curl to `/api/tebra` → **401** ✅
   * Authenticated request with valid Firebase token → **200** ✅
3. Cloud Functions logs show correlation ID but no stack traces for auth errors.

---

## 4  Remaining Tasks

| Task | Priority |
|------|----------|
| Add App Check token verification for callable functions | High |
| Add automated security test in CI (unauth curl → expect 401) | High |
| Review `getFirebaseConfig` exposure – restrict to whitelisted UIDs if needed | Medium |
| Document bearer-token acquisition flow for front-end devs | Medium |

---
Report compiled 2025-06-23. All production functions now enforce authentication and meet HIPAA "minimum necessary" principle.
